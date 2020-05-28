import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from "@angular/material/dialog";
import {HelpDialogComponent} from "./help-dialog.component";
import {DomSanitizer} from "@angular/platform-browser";

@Component({
             selector:  'help-icon',
             template:  '<button mat-button><mat-icon (click)="openDialog()">help</mat-icon></button>',
             styleUrls: ['./help-icon.component.scss']
           })
export class HelpIconComponent implements OnInit {

  public get page(): any {
    return this._page;
  }

  @Input()
  public set page(value: any) {
    this._page = value;
  }

  private _page: any;


  constructor(public dialog: MatDialog, private sanitizer: DomSanitizer) {}

  openDialog() {
    const dialogRef = this.dialog.open(HelpDialogComponent, {
      width: "80%", height: "80%",
      data:  {
        page: this.sanitizer.bypassSecurityTrustResourceUrl('https://socialsensing.com/help-and-support')
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }


  ngOnInit() {
  }

}

