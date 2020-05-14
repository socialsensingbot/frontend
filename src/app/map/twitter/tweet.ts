import {PolygonLayerShortName} from "../types";

export class Tweet {
  public get valid(): boolean {
    return this._valid;
  }

  private _sender: string;
  private _url: string;
  private _valid: boolean;


  public get sender(): string {
    return this._sender;
  }

  public get id(): string {
    return this._id;
  }

  public get url(): string {
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
    const regex = /.*<a href="https:\/\/twitter.com\/(\w+)\/status\/(\d+).*">.*<\/a><\/blockquote>/;
    const matched = _html.match(regex);
    this._valid = (matched != null);
    this._sender = matched[1];
    console.assert(this._id == matched[2]);
    this._url = "https://twitter.com/" + this._sender + "status/" + this._id
  }

}
