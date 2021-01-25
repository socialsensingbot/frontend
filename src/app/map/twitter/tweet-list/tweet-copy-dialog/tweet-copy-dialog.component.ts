import {Component, Inject, OnInit} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {StripHtmlPipe} from "../../../../strip.pipe";

@Component({
             selector:    "app-tweet-copy-dialog",
             templateUrl: "./tweet-copy-dialog.component.html",
             styleUrls:   ["./tweet-copy-dialog.component.scss"]
           })
export class TweetCopyDialogComponent implements OnInit {
  public value: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    this.value = new StripHtmlPipe().transform(this.data.tweet.html);
  }


}
