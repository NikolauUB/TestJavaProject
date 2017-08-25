import {Component, OnInit, ViewChild} from "@angular/core";
import { ModalComponent } from "./modal.component";
import {DiscussionItem} from "../model/DiscussionItem";
import {EditInterface} from "./edit.interface";
import {Router} from "@angular/router";
declare var $ :any;

@Component({
  selector: 'edit-modal-component',
  templateUrl: './editmodal.component.html'

})
export class EditModalComponent {


  @ViewChild(ModalComponent)
  public modal: ModalComponent = new ModalComponent();
  modalName: string;
  model: DiscussionItem = new DiscussionItem();
  itemList: Array<DiscussionItem>;
  saver: EditInterface;
  whatToDo: string = "";
  errorMsg:string;

  constructor(private router: Router) {

  }

  public froalaOptions: Object = {
    charCounterCount: true,
    toolbarButtons: 	['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', '|', 'fontFamily',
      'fontSize', 'paragraphStyle', '|', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent',
      'quote', '-', 'insertLink', '|', 'emoticons', 'specialCharacters', 'insertHR', 'selectAll', 'clearFormatting',
      '|', 'print', 'spellChecker', 'help', 'html', '|', 'undo', 'redo'],
    toolbarButtonsXS: ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', '|', 'fontFamily',
      'fontSize', 'paragraphStyle', '|', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent',
      'quote', '-', 'insertLink', '|', 'emoticons', 'specialCharacters', 'insertHR', 'selectAll', 'clearFormatting',
      '|', 'print', 'spellChecker', 'help', 'html', '|', 'undo', 'redo'],
    toolbarButtonsSM: ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', '|', 'fontFamily',
      'fontSize', 'paragraphStyle', '|', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent',
      'quote', '-', 'insertLink', '|', 'emoticons', 'specialCharacters', 'insertHR', 'selectAll', 'clearFormatting',
      '|', 'print', 'spellChecker', 'help', 'html', '|', 'undo', 'redo'],
    toolbarButtonsMD: ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', '|', 'fontFamily',
      'fontSize', 'paragraphStyle', '|', 'paragraphFormat', 'align', 'formatOL', 'formatUL', 'outdent', 'indent',
      'quote', '-', 'insertLink', '|', 'emoticons', 'specialCharacters', 'insertHR', 'selectAll', 'clearFormatting',
      '|', 'print', 'spellChecker', 'help', 'html', '|', 'undo', 'redo'],
  };



  public showModal(name: string,
                   modelForChange: DiscussionItem,
                   itemList: Array<DiscussionItem>,
                   saver: EditInterface,
                   actionDesc: string): void {
    this.model = new DiscussionItem();
    this.modalName = name;
    this.model = modelForChange;
    this.itemList = itemList;
    this.saver = saver;
    this.whatToDo = actionDesc;
    this.modal.show();
  }


  protected saveItem() {
    this.saver
      .saveItem(this.model)
      .then(reply => this.handleSaveReply(reply))
      .catch(e => this.handleError(e));

  }

  private handleSaveReply(reply: DiscussionItem) {
    this.model = reply;
    if (this.itemList != null) {
      this.itemList.push(this.model);
    }
    this.modal.hide();
  }

  private handleError(e:any): void {
    if(e.status === 403) {
      alert("Ваша сессия не активна. Пожалуйста, зайдите на сайт снова!");
      this.router.navigateByUrl("login");
    } else {
      this.errorMsg = e.json().message || e.toString();
    }
  }

}
