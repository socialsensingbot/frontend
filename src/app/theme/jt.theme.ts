/*
 * © 2020 All rights reserved.
 */

/**
 * Based on :- Kelly's colors is a set of 22 highly contrasting colors.
 *
 * More info:
 * {@link https://i.kinja-img.com/gawker-media/image/upload/1015680494325093012.JPG}
 * {@link https://eleanormaclure.files.wordpress.com/2011/03/colour-coding.pdf}
 */
// @ts-ignore
import * as am4core from "@amcharts/amcharts4/core";

var jt_theme =  (target:any) =>{
  if (target instanceof am4core.ColorSet) {
    target["list"] = [
      am4core.color("#0067FF"),
      am4core.color("#FF9800"),
      am4core.color("#9800FF"),
      am4core.color("#E5210C"),
      am4core.color("#AA9371"),
      am4core.color("#55432A"),
      am4core.color("#50F2B1"),
      am4core.color("#4992FF"),
      am4core.color("#F25B0C"),
      am4core.color("#F2CF0C"),
      am4core.color("#F99379"),
      am4core.color("#B150F2"),
      am4core.color("#CC7900"),
      am4core.color("#B3446C"),
      am4core.color("#DCD300"),
      am4core.color("#882D17"),
      am4core.color("#00FF97"),
      am4core.color("#7F4C00"),
      am4core.color("#E25822"),
      am4core.color("#2B3D26"),
      am4core.color("#F2F3F4"),
      am4core.color("#222222")
    ];
    target["minLightness"] = 0.2;
    target["maxLightness"] = 0.7;
    target["reuse"] = true;
  }
};

export default jt_theme;
