import {PolygonLayerShortName} from "../types";

export class Tweet {
  private _date: Date;
  private _year: string;
  private _month: string;
  private _day: string;
  private _hour: string;
  private _sender: string;
  private _url: string;
  private _valid: boolean;
  private _init: boolean;


  public get date(): Date {
    this.lazyInit();
    return this._date;
  }

  public get year(): string {
    this.lazyInit();
    return this._year;
  }

  public get month(): string {
    this.lazyInit();
    return this._month;
  }

  public get day(): string {
    this.lazyInit();
    return this._day;
  }

  public get hour(): string {
    this.lazyInit();
    return this._hour;
  }

  public get valid(): boolean {
    this.lazyInit();
    return this._valid;
  }

  public get sender(): string {
    this.lazyInit();
    return this._sender;
  }

  public get id(): string {
    return this._id;
  }

  public get url(): string {
    this.lazyInit();
    return this._url;
  }


  get html(): string {
    return this._html;
  }

  get internalDateString(): string {
    return this._internalDateString;
  }

  get poly(): PolygonLayerShortName {
    return this._poly;
  }

  get place(): string {
    return this._place;
  }

  constructor(private _id: string, private _html: string, private _internalDateString: string,
              private _poly: PolygonLayerShortName, private _place: string) {
  }

  private lazyInit() {
    if (!this._init) {

      const regex = /.*<a href="https:\/\/twitter.com\/(\w+)\/status\/(\d+).*">.*<\/a><\/blockquote>/;
      const matched = this._html.match(regex);
      this._valid = (matched != null);
      this._sender = matched[1];
      console.assert(this._id == matched[2]);
      this._url = "https://twitter.com/" + this._sender + "status/" + this._id
      this._date = new Date(Number(this._internalDateString.substring(0, 4)),
                            Number(this._internalDateString.substring(4, 6)) - 1,
                            Number(this._internalDateString.substring(6, 8)),
                            Number(this._internalDateString.substring(8, 10)),
                            +Number(this._internalDateString.substring(10, 12)), 0, 0);
      this._year = new Intl.DateTimeFormat('en', {year: '2-digit'}).format(this._date);
      this._month = new Intl.DateTimeFormat('en', {month: 'short'}).format(this._date);
      this._day = new Intl.DateTimeFormat('en', {day: '2-digit'}).format(this._date);
      this._hour = new Intl.DateTimeFormat('en', {hour: '2-digit', hour12: true}).format(this._date);
      this._init = true;
    }
  }
}
