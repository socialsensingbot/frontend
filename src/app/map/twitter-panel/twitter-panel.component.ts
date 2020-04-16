import {Component, ElementRef, Input, NgZone, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import * as $ from "jquery";
import {MatCheckboxChange} from "@angular/material/checkbox";
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
  public tweets: string[];
  public hidden: boolean[] = [];
  public visibleCount= 0;
  ready: boolean;

  @Input()
  public set embeds(val: any) {
    this._embeds = val;
    this.updateTweets();
  }

  private updateTweets() {
    if (typeof this._embeds !== "undefined") {
      this.ready = false;
      console.log(this._embeds);
      const regex = /(<blockquote(.*?)<\/blockquote>)/g;
      this.tweets = this._embeds.match(regex).map(s => s);
      this.hidden = [];
      this.tweets.forEach(tweet => {
        this.hidden.push(this.pref.isBlacklisted(tweet))
      });
      this.visibleCount= this.hidden.filter(i=>!i).length;
      console.log(this.tweets);
      if (this.tweets.length > 0) {
        //
      } else {
        this.ready = true;
      }
      this.animateTweetAppearance();
    }
  }

  public get embeds(): any {
    return this._embeds;
  }

  @Input() showHeaderInfo: boolean = true;
  @Input() showTimeline: boolean;

  constructor(private _ngZone: NgZone, public pref: PreferenceService) { }

  ngOnInit() {
    if ((window as any).twttr) {
      this.bindTwitter();
    } else {
      setTimeout(() => this.bindTwitter(), 1000);
    }


  }

  private bindTwitter() {
    (window as any).twttr.events.bind(
      'rendered',
      (event) => {
        console.log(event);
        window.setTimeout(() => {
          this._ngZone.run(() => {this.ready = true; event.target.parentNode.style.opacity=1.0;});
        }, 500);

      }
    );
    this.updateTweets();
  }

  private animateTweetAppearance() {
    let i = 0;
    const animatedReappear = () => {
      if (i < this.tweets.length) {
        setTimeout(()=>this._ngZone.run(animatedReappear), 100);
        (window as any).twttr.widgets.load($(".atr-"+i+" blockquote"));
        console.log(i);
        i++;
      }

    };
    animatedReappear();
  }

  public show($event: any) {
    console.log($event);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
    (window as any).twttr.widgets.load($("#tinfo")[0]);
  }

  public removeTweet(tweet, $event: MouseEvent) {
    this.showHide();

  }

  private showHide() {

    for (let j = 0; j < this.tweets.length; j++) {
      this.hidden[j] = this.pref.isBlacklisted(this.tweets[j]);
    }
    this.visibleCount= this.hidden.filter(i=>!i).length;
    window.setTimeout(() => {
      (window as any).twttr.widgets.load($("#tinfo")[0]);
    }, 10);
  }

  public sender(tweet) {
    return this.pref.parseTweet(tweet).sender;
  }

  public showTweet(tweet, $event: MouseEvent) {
    this.showHide();
  }

  public async ignoreSender(tweet, $event: MouseEvent) {
    await this.pref.ignoreSender(tweet);
    this.removeTweet(tweet,$event)
  }

  public async unIgnoreSender(tweet, $event: MouseEvent) {
    await this.pref.unIgnoreSender(tweet);
    this.showTweet(tweet, $event)
  }

  public async ignoreTweet(tweet, $event: MouseEvent) {
    await this.pref.ignoreTweet(tweet);
    this.removeTweet(tweet, $event)
  }

  public async unIgnoreTweet(tweet, $event: MouseEvent) {
    await this.pref.unIgnoreTweet(tweet);
    this.showTweet(tweet, $event)
  }
}
