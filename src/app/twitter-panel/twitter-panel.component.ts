import {Component, Input, OnInit} from '@angular/core';
import * as $ from "jquery";

@Component({
             selector:    'twitter-panel',
             templateUrl: './twitter-panel.component.html',
             styleUrls:   ['./twitter-panel.component.scss']
           })
export class TwitterPanelComponent implements OnInit {

  @Input() count: number;
  @Input() region: string;
  @Input() exceedenceProbability: string;
  private _embeds: string;
  ready:boolean;

  @Input()
  public set embeds(val: any) {
    this.ready=false;
    this._embeds = val;
    (window as any).twttr.widgets.load($("#tinfo")[0]);
  }

  public get embeds(): any {
    return this._embeds;
  }

  @Input() showHeaderInfo: boolean = true;
  @Input() showTimeline: boolean;

  constructor() { }

  ngOnInit() {
    (window as any).twttr.events.bind(
      'rendered',
       (event) =>{
        this.ready= true;
      }
    );

  }

}
