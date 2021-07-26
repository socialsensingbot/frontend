import {Component, Inject, OnInit} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";

@Component({
  selector:    "app-name-graph-dialog",
  templateUrl: "./name-graph-dialog.component.html",
  styleUrls:   ["./name-graph-dialog.component.scss"]
})
export class NameGraphDialogComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  public ngOnInit(): void {
  }


}
