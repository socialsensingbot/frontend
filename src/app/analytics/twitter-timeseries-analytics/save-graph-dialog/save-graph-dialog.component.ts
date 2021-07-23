import {Component, Inject, OnInit} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";

@Component({
  selector: "app-save-graph-dialog",
  templateUrl: "./save-graph-dialog.component.html",
  styleUrls: ["./save-graph-dialog.component.scss"]
})
export class SaveGraphDialogComponent implements OnInit {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  public ngOnInit(): void {
  }


}
