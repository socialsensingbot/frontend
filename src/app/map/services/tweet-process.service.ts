import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TweetProcessService {

  constructor() { }

 getStatsIdx(place, val, poly, B, statsData) {
    for (let i = 0; i < B; i++) {
      if (val <= statsData[poly][place][i]) {
        return i;
      }
    }
    return B;
  }

getTimes(tweetInfo) {
  const time_keys = Object.keys(tweetInfo);
    time_keys.sort();
    time_keys.reverse();
    return time_keys;
  }

  processData(tweetInfo, processedTweetInfo, polygonData, statsData, B, time_keys, grid_sizes) {
    console.log("Processing data");
    //clean dicts
    for (const poly in processedTweetInfo) { //counties, coarse, fine
      for (let i = 0; i < polygonData[poly]["features"].length; i++) {
        const place = polygonData[poly]["features"][i]["properties"]["name"];
        if (place in processedTweetInfo[poly]["count"]) {
          polygonData[poly]["features"][i]["properties"]["count"] = 0;
          polygonData[poly]["features"][i]["properties"]["stats"] = 0;
        }
      }
    }
    for (const k in processedTweetInfo) {
      for (const p in processedTweetInfo[k]) {
        processedTweetInfo[k][p] = {};
      }
    }


    for (const i in time_keys) { //all times
      var tid = time_keys[i];
      for (const poly in processedTweetInfo) { //counties, coarse, fine
        for (const place in tweetInfo[tid][grid_sizes[poly]]) { //all counties/boxes
          //add the counts
          const wt = tweetInfo[tid][grid_sizes[poly]][place]["w"];
          if (place in processedTweetInfo[poly]["count"]) {
            processedTweetInfo[poly]["count"][place] += wt;
          } else {
            processedTweetInfo[poly]["count"][place] = wt;
            processedTweetInfo[poly]["embed"][place] = ""
          }
          for (const i in tweetInfo[tid][grid_sizes[poly]][place]["i"]) {
            const tweetcode_id = tweetInfo[tid][grid_sizes[poly]][place]["i"][i];
            const tweetcode = tweetInfo[tid]["tweets"][tweetcode_id]; //html of the tweet
            if (tweetcode != "" && processedTweetInfo[poly]["count"][place] < 100) { //should I show a max #of tweets?
              processedTweetInfo[poly]["embed"][place] += "<tr><td>" + tweetcode + "</td></tr>"
            }
          }
        }
      }
    }

    //update polys
    var tdiff = time_keys.length / 1440;
    for (var poly in processedTweetInfo) { //counties, coarse, fine
      for (var i = 0; i < polygonData[poly]["features"].length; i++) {
        var place = polygonData[poly]["features"][i]["properties"]["name"];
        if (place in processedTweetInfo[poly]["count"]) {
          var wt = processedTweetInfo[poly]["count"][place];
          var stats_wt = 0;
          if (wt) {
            var as_day = wt / tdiff; //average # tweets per day arraiving at a constant rate
            stats_wt = this.getStatsIdx(place, as_day, poly, B, statsData); //number of days with fewer tweets
            //exceedance probability = rank / (#days + 1) = p
            //rank(t) = #days - #days_with_less_than(t)
            //prob no events in N days = (1-p)^N
            //prob event in N days = 1 - (1-p)^N
            stats_wt = 100 * (1 - Math.pow(1 - ((B + 1 - stats_wt) / (B + 1)), tdiff));
          }

          processedTweetInfo[poly]["stats"][place] = stats_wt;
          polygonData[poly]["features"][i]["properties"]["count"] = wt;
          polygonData[poly]["features"][i]["properties"]["stats"] = stats_wt;
        }
      }
    }


  }

}
