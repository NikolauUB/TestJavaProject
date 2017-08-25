package wind.instrument.competitions.rest;

import wind.instrument.competitions.data.*;
import wind.instrument.competitions.rest.model.ActiveCompetitions;
import wind.instrument.competitions.rest.model.CompetitionData;
import wind.instrument.competitions.rest.model.CompetitionMember;
import wind.instrument.competitions.rest.model.PartakeThread;
import wind.instrument.competitions.rest.model.discussion.DiscussionItem;
import wind.instrument.competitions.rest.model.status.StatusOfDiscussionItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.List;
import java.util.ResourceBundle;

@RestController
@Transactional
public class DiscussService {
    private static Logger LOG = LoggerFactory.getLogger(DiscussService.class);
    /**
     * Russian messages
     */
    private static ResourceBundle bundle = ResourceBundle.getBundle("Messages");

    @PersistenceContext
    private EntityManager em;

    @Autowired
    private HttpSession httpSession;

    @RequestMapping(value = "/api/getActiveCompetitions", method = RequestMethod.GET)
    public ActiveCompetitions getActiveCompetitions(HttpServletResponse response) {
        ActiveCompetitions result = new ActiveCompetitions();
        TypedQuery<CompetitionEntity> activeCometQuery =
                em.createQuery("select c from CompetitionEntity c where c.active = true",
                        CompetitionEntity.class);
        try {
            List<CompetitionEntity>  competList = activeCometQuery.getResultList();
            ArrayList<Integer> list = new ArrayList<Integer>();
            competList.forEach((item)->{
                list.add(item.getCompetitionType().getValue());
            });
            result.setTypes(list);
        } catch (NoResultException ex) {
            this.sendResponseError(HttpServletResponse.SC_NOT_FOUND, bundle.getString("ACTIVE_COMPETIONS_IS_NOT_FOUND"), response);
        }
        return result;
    }


    @RequestMapping(value = "/api/getActiveCompetitionData", method = RequestMethod.GET)
    public CompetitionData getActiveCompetitionData(@RequestParam("tp") Integer competitionType,
                                                   HttpServletResponse response) {
        CompetitionData result = null;
        if (competitionType == null) {
            this.sendResponseError(HttpServletResponse.SC_BAD_REQUEST, "Type is not set", response);
            return result;
        }

        TypedQuery<CompetitionEntity> activeCometQuery =
                em.createQuery("select c from CompetitionEntity c where c.active = true and c.competitionType=:type",
                        CompetitionEntity.class);
        try {
            CompetitionEntity competitionEntity = activeCometQuery.setParameter("type", competitionType).getSingleResult();

            result = new CompetitionData(
                    competitionEntity.getCompetitionId(),
                    competitionEntity.getCompetitionName(),
                    competitionEntity.getCompetitionType().getValue(),
                    competitionEntity.getCompetitionDesc(),
                    competitionEntity.getCompetitionSampleVideo(),
                    competitionEntity.getCompetitionStart(),
                    competitionEntity.getCompetitionEnd());
            return result;
        } catch (NoResultException ex) {
            this.sendResponseError(HttpServletResponse.SC_NOT_FOUND, bundle.getString("ACTIVE_COMPETIONS_IS_NOT_FOUND"), response);
        }
        return result;
    }

    /**
     * Checks every time when user sees|removes partake request
     *
     * @param response
     * @return
     */
    @RequestMapping(value = "/api/getCompetitionMembers", method = RequestMethod.GET)
    public ArrayList<CompetitionMember> getCompetitionMembers(HttpServletResponse response) {
        ArrayList<CompetitionMember> result = new ArrayList<CompetitionMember>();
        TypedQuery<CompetitionEntity> activeCometQuery =
                em.createQuery("select c from CompetitionEntity c where c.active = true",
                        CompetitionEntity.class);
        try {
            List<CompetitionEntity>  competitionList = activeCometQuery.getResultList();
            competitionList.forEach((item)->{
                item.getThemesByMembers().forEach((theme) -> {
                    CompetitionMember competitionMember = new CompetitionMember();
                    UserEntity member = theme.getOwner();
                    competitionMember.setmId(member.getUserId());
                    competitionMember.setmUsername(member.getUsername());
                    competitionMember.setCompType(item.getCompetitionType().getValue());
                    result.add(competitionMember);
                });
            });
        } catch (NoResultException ex) {
            this.sendResponseError(HttpServletResponse.SC_NOT_FOUND, bundle.getString("ACTIVE_COMPETIONS_IS_NOT_FOUND"), response);
        }
        return result;
    }
    /**
     * Discussion user's thread and all threads for admin for competition
     *
     * @param competitionId - discussed competition id
     * @param response
     * @return
     */
    @RequestMapping(value = "/api/getPartakeDiscuss", method = RequestMethod.GET)
    public PartakeThread getPartakeDiscussion(@RequestParam("cId") Long competitionId, HttpServletResponse response) {
        PartakeThread result = new PartakeThread();
        if (competitionId == null) {
            this.sendResponseError(HttpServletResponse.SC_BAD_REQUEST, "Competition id is not set!", response);
            return result;
        }
        UserEntity currentUser = em.find(UserEntity.class, httpSession.getAttribute("USER_ID"));
        if (AuthService.ADMIN_USERNAME.equals(currentUser.getUsername())) {
            return getAllPartakesForAdmin(competitionId, result);
        }

        //simple user see own requests and admins replies
        //find theme first
        TypedQuery<ThemeEntity> themeQuery =
                em.createQuery("select t from ThemeEntity t where t.userId = :userId and t.themeType = :type and t.competitionId = :cId",
                        ThemeEntity.class);
        ThemeEntity usersPartakeTheme = null;
        try {
            usersPartakeTheme = themeQuery.setParameter("userId", currentUser.getUserId())
                    .setParameter("type", ThemeType.COMPETITION_REQUEST.getValue())
                    .setParameter("cId", competitionId)
                    .getSingleResult();
        } catch (NoResultException ex) { }

        //find messages in the theme
        if (usersPartakeTheme != null) {
            TypedQuery<MessageEntity> msgQuery =
                    em.createQuery("select m from MessageEntity m where  m.themeId = :threadId order by m.created",
                            MessageEntity.class);
            try {
                List<MessageEntity> msgList = msgQuery.setParameter("threadId", usersPartakeTheme.getId()).getResultList();
                this.fillInDiscussionItems(msgList, competitionId, result);
            } catch (NoResultException ex) { }
        }
        return result;
    }

    /**
     * Admin see all requests
     *
     * @param competitionId
     * @param result
     * @return
     */
    private PartakeThread getAllPartakesForAdmin(Long competitionId, PartakeThread result) {
        TypedQuery<MessageEntity> msgQuery =
                em.createQuery("select m from MessageEntity m," +
                                " ThemeEntity t where  m.themeId = t.id and t.themeType = :type and t.competitionId = :cId",
                        MessageEntity.class);
        List<MessageEntity> allPartakeTheme = null;
        try {
            allPartakeTheme = msgQuery
                    .setParameter("type", ThemeType.COMPETITION_REQUEST.getValue())
                    .setParameter("cId", competitionId)
                    .getResultList();
        } catch (NoResultException ex) { }
        this.fillInDiscussionItems(allPartakeTheme, competitionId, result);
        return result;
    }

    private void fillInDiscussionItems(List<MessageEntity> messages, Long competitionId, PartakeThread result) {
        ArrayList<DiscussionItem> discussionItemList = new ArrayList<DiscussionItem>();
        for (MessageEntity item : messages) {
            DiscussionItem discussionItem = new DiscussionItem();
            discussionItem.setCompetitionId(competitionId);
            discussionItem.setAuthorId(item.getUserId());
            discussionItem.setUpdateDate(item.getUpdated());
            discussionItem.setCreationDate(item.getCreated());
            discussionItem.setMsgId(item.getMsgId());
            discussionItem.setMsgText(item.getMsgBody());
            discussionItem.setMsgThreadId(item.getThemeId());
            discussionItem.setParentMsgId(item.getParentMsgId());
            discussionItemList.add(discussionItem);
        }
        result.setDiscussionItems(discussionItemList);
    }

    @RequestMapping(value = "/api/deletePartake", method = RequestMethod.DELETE)
    public void deletePartakeMessage(@RequestParam("iid") Long itemId, HttpServletResponse response) {
        if (itemId == null) {
            this.sendResponseError(HttpServletResponse.SC_BAD_REQUEST, "Item Id is not set!", response);
        }
        UserEntity currentUser = em.find(UserEntity.class, httpSession.getAttribute("USER_ID"));
        MessageEntity messageEntity = null;
        try {
            messageEntity = em.find(MessageEntity.class, itemId);
        } catch (NoResultException ex) {
            //do nothing
        }
        if (messageEntity == null) {
            //todo translate
            this.sendResponseError(HttpServletResponse.SC_NOT_FOUND, "Message doesn't exist!", response);
        }
        if (messageEntity.getUserId() != currentUser.getUserId()) {
            //todo translate
            this.sendResponseError(HttpServletResponse.SC_BAD_REQUEST, "Message belongs to other user! It cannot be deleted!", response);
        } else {
            try {
                if(messageEntity.getParentMsgId() == null) {
                    ThemeEntity themeEntity = em.find(ThemeEntity.class, messageEntity.getThemeId());
                    em.remove(messageEntity);
                    if(themeEntity.getUserId() == currentUser.getUserId()) {
                        em.remove(themeEntity);
                    }
                } else {
                    em.remove(messageEntity);
                }

            } catch(Exception ex) {
                LOG.debug("Error deleting partake message: ", ex);
                this.sendResponseError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, bundle.getString("SERVER_ERROR"), response);
            }
        }
    }


    @RequestMapping(value = "/api/submitPartake", method = RequestMethod.POST)
    public DiscussionItem submitPartake(@RequestBody DiscussionItem discussionItem, HttpServletResponse response) {

        if(discussionItem.getMsgText() == null || discussionItem.getMsgText().trim().length() == 0) {
            this.sendResponseError(HttpServletResponse.SC_BAD_REQUEST, bundle.getString("EMPTY_MSG_BODY"), response);
            return discussionItem;
        }
        if (discussionItem.getCompetitionId() == null) {
            this.sendResponseError(HttpServletResponse.SC_BAD_REQUEST, "Competition id is not set!", response);
            return discussionItem;
        }
        UserEntity currentUser = em.find(UserEntity.class, httpSession.getAttribute("USER_ID"));
        if (AuthService.ADMIN_USERNAME.equals(currentUser.getUsername()) && discussionItem.getParentMsgId() != null) {
            return persistMessage(discussionItem, null, currentUser, response);
        }

        TypedQuery<ThemeEntity> themeQuery =
                em.createQuery("select t from ThemeEntity t where t.userId = :userId and t.themeType = :type and t.competitionId = :cId",
                        ThemeEntity.class);
        try {
            ThemeEntity usersPartakeTheme = null;
            try {
                usersPartakeTheme = themeQuery.setParameter("userId", currentUser.getUserId())
                        .setParameter("cId", discussionItem.getCompetitionId())
                        .setParameter("type", ThemeType.COMPETITION_REQUEST.getValue()).getSingleResult();
            } catch (NoResultException ex) {
                //do nothing
            }
            if (usersPartakeTheme == null) {
                usersPartakeTheme = new ThemeEntity();
                usersPartakeTheme.setUserId(currentUser.getUserId());
                usersPartakeTheme.setCompetitionId(discussionItem.getCompetitionId());
                usersPartakeTheme.setName("Partake theme for competition " + discussionItem.getCompetitionId() +
                        " by " + currentUser.getUsername() + ":" + currentUser.getEmail());
                usersPartakeTheme.setThemeType(ThemeType.COMPETITION_REQUEST);
                em.persist(usersPartakeTheme);
            }
            if (discussionItem.getMsgThreadId() != null && discussionItem.getMsgThreadId() != usersPartakeTheme.getId()) {
                LOG.info("Bad request from client. Tries to save data for theme " + discussionItem.getMsgThreadId());
                this.sendResponseError(HttpServletResponse.SC_BAD_REQUEST, "Bad request. The thread doesn't belongs to you!", response);
                return discussionItem;
            }
            return persistMessage(discussionItem, usersPartakeTheme, currentUser, response);
        } catch (Exception ex) {
            LOG.debug("Error saving partake message: ",ex);
            this.sendResponseError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, bundle.getString("SERVER_ERROR"), response);
            return discussionItem;
        }

    }

    private DiscussionItem persistMessage(DiscussionItem discussionItem,
                                ThemeEntity usersPartakeTheme, //null for admin
                                UserEntity currentUser,
                                HttpServletResponse response) {
        MessageEntity message = new MessageEntity();
        if(discussionItem.getMsgId() != null) {
            message = em.find(MessageEntity.class, discussionItem.getMsgId());
            if(usersPartakeTheme != null && message.getThemeId() != usersPartakeTheme.getId()) {
                LOG.debug("ERROR: Message " + message.getMsgId() + " doesn't belong to theme " + usersPartakeTheme.getId());
                this.sendResponseError(HttpServletResponse.SC_BAD_REQUEST, "\"Bad request! Message \" + message.getMsgId() + \" doesn't belong to theme \" + usersPartakeTheme.getId()", response);
                return discussionItem;
            }
            if(message.getUserId() != currentUser.getUserId()) {
                LOG.debug("ERROR: Message " + message.getMsgId() + " doesn't belong to user " + currentUser.getUserId());
                this.sendResponseError(HttpServletResponse.SC_BAD_REQUEST, "Bad request! Message doesn't belongs to you", response);
                return discussionItem;
            }
        } else {
            message.setUserId(currentUser.getUserId());
            message.setThemeId((usersPartakeTheme != null) ? usersPartakeTheme.getId() : discussionItem.getMsgThreadId());
            message.setParentMsgId(discussionItem.getParentMsgId());
        }
        message.setMsgBody(discussionItem.getMsgText());
        em.persist(message);
        //return back
        discussionItem.setMsgId(message.getMsgId());
        discussionItem.setAuthorId(message.getUserId());
        discussionItem.setCreationDate(message.getCreated());
        discussionItem.setUpdateDate(message.getUpdated());
        discussionItem.setMsgThreadId(message.getThemeId());
        return discussionItem;
    }

    private void  sendResponseError(int code, String text,  HttpServletResponse response) {
        try {
            response.sendError(code, text);
        } catch (Exception ex) {
            LOG.error("Something wrong sending error responses", ex);
        }
    }
}
