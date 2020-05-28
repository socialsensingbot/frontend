import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from "@angular/material/dialog";
import {HelpDialogComponent} from "./help-dialog.component";

@Component({
             selector:  'help-span',
             template:  '<span class="help-span" [matTooltip]="tooltip" (click)="openDialog()"><ng-content></ng-content></span>',
             styleUrls: ['./help-span.component.scss']
           })
export class HelpSpanComponent implements OnInit {

  @Input()
  private page: string;
  @Input()
  public tooltip: string;


  constructor(public dialog: MatDialog) {}

  openDialog() {
    const dialogRef = this.dialog.open(HelpDialogComponent, {
      width: "80%", height: "80%",
      data:  {
        page: this.page
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }


  ngOnInit() {
  }

}

