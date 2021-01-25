
import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
        name: "striphtml"
      })

export class StripHtmlPipe implements PipeTransform {
  transform(value: string): any {
    const txt = document.createElement("textarea");
    txt.innerHTML = value;
    return txt.value.replace(/<[^>]*>/g, ""); // replace tags
  }
}
