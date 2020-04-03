import {
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  ViewRef
} from '@angular/core';
import * as $ from "jquery";
import {HttpClient} from "@angular/common/http";
import {MatCheckboxChange} from "@angular/material/checkbox";
import {Router} from "@angular/router";
import {PreferenceService} from "../../pref/preference.service";

@Component({
             selector:    'twitter-panel',
             templateUrl: './twitter-panel.component.html',
             styleUrls:   ['./twitter-panel.component.scss']
           })
export class TwitterPanelComponent implements OnInit, OnChanges {

  @ViewChild("tinfoEmbeds", {read: ElementRef, static: false}) tinfoEmbeds: ElementRef;
  @Input() count: number;
  @Input() region: string;
  @Input() exceedenceProbability: string;
  private _embeds: string;
  private tweets: string[];
  ready: boolean;

  @Input()
  public set embeds(val: any) {
    this._embeds = val;
    this.updateTweets();
  }

  private updateTweets() {
    if (typeof this._embeds !== "undefined") {
      this.ready = false;
      const regex = /(<blockquote(.*?)<\/blockquote>)/g;
      this.tweets = this._embeds.match(regex).map(s => s).filter(s => !this.pref.isBlacklisted(s));
      console.log(this.tweets);
      if (this.tweets.length > 0) {
        (window as any).twttr.widgets.load($("#tinfo")[0]);
      } else {
        this.ready = true;
      }
    }
  }

  public get embeds(): any {
    return this._embeds;
  }

  @Input() showHeaderInfo: boolean = true;
  @Input() showTimeline: boolean;

  constructor(private _ngZone: NgZone, public pref: PreferenceService  ) { }

  ngOnInit() {
    if((window as any).twttr) {
      this.bindTwitter();
    } else {
      setTimeout(()=> this.bindTwitter(),1000);
    }


  }

  private bindTwitter() {
    (window as any).twttr.events.bind(
      'rendered',
      (event) => {
        window.setTimeout(() => {
          this._ngZone.runOutsideAngular(() => this.ready = true);
        }, 500);

      }
    );
    this.updateTweets();
  }

  public show($event: any) {
    console.log($event);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
  }

  public checked(i: number, $event: MatCheckboxChange) {
   //
  }

  public removeTweet(tweet) {
    this.tweets.splice(this.tweets.indexOf(tweet), 1);
  }
}
