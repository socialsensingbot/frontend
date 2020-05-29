import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from "@angular/material/dialog";
import {HelpDialogComponent} from "./help-dialog.component";
import {Logger} from "aws-amplify";
import {DomSanitizer} from "@angular/platform-browser";

const log = new Logger('help-span');

@Component({
             selector:  'help',
             template:  '<span class="help-span" [matTooltip]="tooltip" (click)="openDialog()"><ng-content></ng-content></span>',
             styleUrls: ['./help-span.component.scss']
           })
export class HelpSpanComponent implements OnInit {

  @Input()
  private page: string;
  @Input()
  public tooltip: string;


  constructor(public dialog: MatDialog, private sanitizer: DomSanitizer) {}

  openDialog() {
    const dialogRef = this.dialog.open(HelpDialogComponent, {
      width: "80%", height: "80%",
      data:  {
        page: this.sanitizer.bypassSecurityTrustResourceUrl('https://socialsensing.com/' + this.page)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      log.verbose(`Dialog result: ${result}`);
    });
  }


  ngOnInit() {
  }

}

