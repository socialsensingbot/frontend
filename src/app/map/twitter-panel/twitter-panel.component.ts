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
    if(typeof val !== "undefined") {
      this.ready = false;
      const regex=/(<blockquote(.*?)<\/blockquote>)/g;
      this.tweets= val.match(regex).map(s=>s);
      console.log(this.tweets);
      (window as any).twttr.widgets.load($("#tinfo")[0]);
    }
  }

  public get embeds(): any {
    return this._embeds;
  }

  @Input() showHeaderInfo: boolean = true;
  @Input() showTimeline: boolean;

  constructor(private _ngZone: NgZone) { }

  ngOnInit() {
    (window as any).twttr.events.bind(
      'rendered',
      (event) => {
        window.setTimeout(() => {
          this._ngZone.runOutsideAngular(() => this.ready = true);
        }, 500);

      }
    );

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
}
