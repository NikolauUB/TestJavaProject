import {Component, AfterViewInit, ViewChild} from "@angular/core";
import { ModalComponent } from "./modal.component";
import {DiscussionItem} from "../model/DiscussionItem";
import {EditInterface} from "./edit.interface";
import {Router} from "@angular/router";
declare var $ :any;
declare var nicEditor: any;

@Component({
  selector: 'edit-modal-component',
  templateUrl: './nicedit.component.html'
})
export class EditModalComponent implements AfterViewInit{
  @ViewChild(ModalComponent)
  modal: ModalComponent = new ModalComponent();
  modalName: string;
  model: DiscussionItem = new DiscussionItem();
  saver: EditInterface;
  saved: boolean = false;
  whatToDo: string = "";
  errorMsg:string;
  nicEdit:any;

  constructor(private router: Router) {

  }

  ngAfterViewInit() {
    this.nicEdit = new nicEditor({
      buttonList: ['bold', 'italic', 'underline', 'left', 'center', 'right', 'justify',
        'ol', 'ul', 'subscript', 'superscript', 'strikethrough', 'removeformat',
        'indent', 'outdent', 'hr', 'image', 'forecolor', 'bgcolor', 'link', 'unlink',
        'fontSize', 'fontFamily', 'fontFormat', 'xhtml']
    }).panelInstance('nickEdit');
  }

  public showModal(name: string,
                   modelForChange: DiscussionItem,
                   saver: EditInterface,
                   actionDesc: string): void {
    this.adjustEdit();
    this.errorMsg = "";
    this.model = new DiscussionItem();
    this.modalName = name;
    this.model = modelForChange;
    if (this.model.msgText) {
      this.nicEdit.instanceById('nickEdit').setContent(this.model.msgText);
    } else {
      this.nicEdit.instanceById('nickEdit').setContent("");
    }
    this.saver = saver;
    this.saved = false;
    this.whatToDo = actionDesc;
    window.scrollTo(0,0);
    this.modal.show();
  }

  public adjustEdit() {
    var height = (window.innerHeight / 2.5) + "px";
    var mainHeight = (window.innerHeight / 3) + "px";
    $('#nickEdit').parent().height(height);
    $('.nicEdit-main').height(mainHeight);
  }


  protected saveItem() {
    var text = this.nicEdit.instanceById('nickEdit').getContent();
    if (text.length > 8192) {
      this.errorMsg="Размер текста заявки ограничен размером 8 килобайт. Посмотреть текст в формате HTML можно по кнопке 'Edit HTML'.";
    } else {
      this.saved = true;
      this.model.msgText = text;
      this.saver.saveItem(this.model);
    }

  }

  public hide() {
    this.modal.hide();
    this.model = new DiscussionItem();
  }

  public handleError(e:any): void {
    if(e.status === 403) {
      alert("Ваша сессия не активна. Пожалуйста, зайдите на сайт снова!");
      this.router.navigateByUrl("login");
    } else {
      this.errorMsg =  (e.json() && e.json().message) || e.toString();
    }
  }

}
