import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from "@angular/material/dialog";
import {HelpDialogComponent} from "./help-dialog.component";

@Component({
             selector:  'help-icon',
             template:  '<mat-icon (click)="openDialog()">help</mat-icon>',
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


  constructor(public dialog: MatDialog) {}

  openDialog() {
    const dialogRef = this.dialog.open(HelpDialogComponent, {
      data: {
        page: this._page
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }


  ngOnInit() {
  }

}

