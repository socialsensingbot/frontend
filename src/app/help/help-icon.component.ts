import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from "@angular/material/dialog";
import {HelpDialogComponent} from "./help-dialog.component";

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


  constructor(public dialog: MatDialog) {}

  openDialog() {
    const dialogRef = this.dialog.open(HelpDialogComponent, {
      width: "80%", height: "80%",
      data:  {
        page: "help-and-support"
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }


  ngOnInit() {
  }

}

