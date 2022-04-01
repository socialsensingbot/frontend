import * as request from "supertest";
import {expect} from "chai";
import {MAX_DATE_MILLIS, MIN_DATE_MILLIS} from "../../constants";
import * as app from "../../../app"

const singleRegion =
    [{
        "json":               {
            "id":                        1437723439423529000,
            "geo":                       null,
            "lang":                      "en",
            "text":                      "@whtimes Tewin Water, the clue is in the name - it floods.  My cousin lives nearby and has been affected.",
            "user":                      {
                "id":                                 351926710,
                "url":                                "https://www.hertfordandstortfordconservatives.org",
                "lang":                               null,
                "name":                               "Cllr Jan Goodeve",
                "id_str":                             "351926710",
                "location":                           "Hertford, Herts",
                "verified":                           false,
                "following":                          null,
                "protected":                          false,
                "time_zone":                          null,
                "created_at":                         "Tue Aug 09 22:33:03 +0000 2011",
                "utc_offset":                         null,
                "description":                        "ex SG Warburg, UBS Investment Bank & Rapiergroup.  Councillor on East Herts District and Hertford Town Councils for Castle Ward. Mum to Sophie & Tom",
                "geo_enabled":                        true,
                "screen_name":                        "JanGoodeve",
                "listed_count":                       27,
                "friends_count":                      824,
                "is_translator":                      false,
                "notifications":                      null,
                "statuses_count":                     5907,
                "default_profile":                    true,
                "followers_count":                    900,
                "translator_type":                    "none",
                "favourites_count":                   8891,
                "profile_image_url":                  "http://pbs.twimg.com/profile_images/1386761493140606977/OcgxVANa_normal.jpg",
                "profile_banner_url":                 "https://pbs.twimg.com/profile_banners/351926710/1620577401",
                "profile_link_color":                 "1DA1F2",
                "profile_text_color":                 "333333",
                "follow_request_sent":                null,
                "contributors_enabled":               false,
                "default_profile_image":              false,
                "withheld_in_countries":              [],
                "profile_background_tile":            false,
                "profile_image_url_https":            "https://pbs.twimg.com/profile_images/1386761493140606977/OcgxVANa_normal.jpg",
                "profile_background_color":           "C0DEED",
                "profile_sidebar_fill_color":         "DDEEF6",
                "profile_background_image_url":       "http://abs.twimg.com/images/themes/theme1/bg.png",
                "profile_sidebar_border_color":       "C0DEED",
                "profile_use_background_image":       true,
                "profile_background_image_url_https": "https://abs.twimg.com/images/themes/theme1/bg.png"
            },
            "place":                     null,
            "id_str":                    "1437723439423528963",
            "source":                    "<a href=\"http://twitter.com/download/iphone\" rel=\"nofollow\">Twitter for iPhone</a>",
            "entities":                  {
                "urls":          [],
                "symbols":       [],
                "hashtags":      [],
                "user_mentions": [{
                    "id":          26535725,
                    "name":        "Welwyn Hatfield Times",
                    "id_str":      "26535725",
                    "indices":     [0, 8],
                    "screen_name": "whtimes"
                }]
            },
            "trackstr":                  "flood, floods, flooding, flooded",
            "favorited":                 false,
            "retweeted":                 false,
            "truncated":                 false,
            "collection":                "flood_collection",
            "created_at":                "Tue Sep 14 10:22:34 +0000 2021",
            "coordinates":               null,
            "quote_count":               0,
            "reply_count":               0,
            "contributors":              null,
            "filter_level":              "low",
            "timestamp_ms":              "1631614954225",
            "trackphrases":              ["flood", "flooded", "flooding", "floods"],
            "retweet_count":             0,
            "favorite_count":            0,
            "is_quote_status":           false,
            "display_text_range":        [9, 105],
            "in_reply_to_user_id":       26535725,
            "in_reply_to_status_id":     1437722428629602300,
            "in_reply_to_screen_name":   "whtimes",
            "in_reply_to_user_id_str":   "26535725",
            "in_reply_to_status_id_str": "1437722428629602305"
        },
        "timestamp":          "2021-09-14T10:22:34.000Z",
        "id":                 "1437723439423528963",
        "location":           "{\"type\": \"GeometryCollection\", \"geometries\": [{\"type\": \"Point\", \"coordinates\": [-0.156, 51.817]}]}",
        "region":             "hertfordshire",
        "possibly_sensitive": 0,
        "source":             "twitter",
        "region_type":        "county",
        "hazard":             "flood",
        "warning":            0
    }, {
        "json":               {
            "id":                        1437680393499598800,
            "geo":                       null,
            "lang":                      "en",
            "text":                      "With heavy #rain predicted today, there may be some localised flooding.\nBe #floodaware #weatheraware \n\nDon’t drive… https://t.co/BgFe9wjD2G",
            "user":                      {
                "id":                                 1095147800,
                "url":                                "http://www.hertsboatrescue.org.uk",
                "lang":                               null,
                "name":                               "herts boat rescue",
                "id_str":                             "1095147800",
                "location":                           "hertfordshire",
                "verified":                           false,
                "following":                          null,
                "protected":                          false,
                "time_zone":                          null,
                "created_at":                         "Wed Jan 16 13:02:18 +0000 2013",
                "utc_offset":                         null,
                "description":                        "#waterrescue in #hertfordshire #Waterbasedsearchandrescue specialist Water rescue #independantlifeboat",
                "geo_enabled":                        false,
                "screen_name":                        "hertsboatrescue",
                "listed_count":                       15,
                "friends_count":                      376,
                "is_translator":                      false,
                "notifications":                      null,
                "statuses_count":                     3934,
                "default_profile":                    false,
                "followers_count":                    729,
                "translator_type":                    "none",
                "favourites_count":                   3314,
                "profile_image_url":                  "http://pbs.twimg.com/profile_images/1418978627849437187/Vw073MfE_normal.jpg",
                "profile_banner_url":                 "https://pbs.twimg.com/profile_banners/1095147800/1602094766",
                "profile_link_color":                 "0084B4",
                "profile_text_color":                 "333333",
                "follow_request_sent":                null,
                "contributors_enabled":               false,
                "default_profile_image":              false,
                "withheld_in_countries":              [],
                "profile_background_tile":            true,
                "profile_image_url_https":            "https://pbs.twimg.com/profile_images/1418978627849437187/Vw073MfE_normal.jpg",
                "profile_background_color":           "C0DEED",
                "profile_sidebar_fill_color":         "F3F3F3",
                "profile_background_image_url":       "http://abs.twimg.com/images/themes/theme7/bg.gif",
                "profile_sidebar_border_color":       "FFFFFF",
                "profile_use_background_image":       true,
                "profile_background_image_url_https": "https://abs.twimg.com/images/themes/theme7/bg.gif"
            },
            "place":                     null,
            "id_str":                    "1437680393499598849",
            "source":                    "<a href=\"http://twitter.com/download/iphone\" rel=\"nofollow\">Twitter for iPhone</a>",
            "entities":                  {
                "urls":          [{
                    "url":          "https://t.co/BgFe9wjD2G",
                    "indices":      [116, 139],
                    "display_url":  "twitter.com/i/web/status/1…",
                    "expanded_url": "https://twitter.com/i/web/status/1437680393499598849"
                }],
                "symbols":       [],
                "hashtags":      [{"text": "rain", "indices": [11, 16]}, {"text": "floodaware", "indices": [75, 86]},
                                  {"text": "weatheraware", "indices": [87, 100]}],
                "user_mentions": []
            },
            "trackstr":                  "flood, floods, flooding, flooded",
            "favorited":                 false,
            "retweeted":                 false,
            "truncated":                 true,
            "collection":                "flood_collection",
            "created_at":                "Tue Sep 14 07:31:31 +0000 2021",
            "coordinates":               null,
            "quote_count":               0,
            "reply_count":               0,
            "contributors":              null,
            "filter_level":              "low",
            "timestamp_ms":              "1631604691277",
            "trackphrases":              ["flood", "flooded", "flooding", "floods"],
            "retweet_count":             0,
            "extended_tweet":            {
                "entities":           {
                    "urls":          [],
                    "media":         [{
                        "id":              1437680369399210000,
                        "url":             "https://t.co/inmPbcRzjG",
                        "type":            "photo",
                        "sizes":           {
                            "large":  {"h": 1536, "w": 2048, "resize": "fit"},
                            "small":  {"h": 510, "w": 680, "resize": "fit"},
                            "thumb":  {"h": 150, "w": 150, "resize": "crop"},
                            "medium": {"h": 900, "w": 1200, "resize": "fit"}
                        },
                        "id_str":          "1437680369399209986",
                        "indices":         [210, 233],
                        "media_url":       "http://pbs.twimg.com/media/E_OqrcaXoAI_Zpu.jpg",
                        "display_url":     "pic.twitter.com/inmPbcRzjG",
                        "expanded_url":    "https://twitter.com/hertsboatrescue/status/1437680393499598849/photo/1",
                        "media_url_https": "https://pbs.twimg.com/media/E_OqrcaXoAI_Zpu.jpg"
                    }],
                    "symbols":       [],
                    "hashtags":      [{"text": "rain", "indices": [11, 16]}, {"text": "floodaware", "indices": [75, 86]},
                                      {"text": "weatheraware", "indices": [87, 100]}, {"text": "floodwater", "indices": [138, 149]},
                                      {"text": "Drivetosurvive", "indices": [152, 167]}, {"text": "hertfordshire", "indices": [170, 184]},
                                      {"text": "waterrescue", "indices": [185, 197]}, {"text": "volunteers", "indices": [198, 209]}],
                    "user_mentions": []
                },
                "full_text":          "With heavy #rain predicted today, there may be some localised flooding.\nBe #floodaware #weatheraware \n\nDon’t drive into unknown depths of #floodwater - #Drivetosurvive \n\n#hertfordshire #waterrescue #volunteers https://t.co/inmPbcRzjG",
                "extended_entities":  {
                    "media": [{
                        "id":              1437680369399210000,
                        "url":             "https://t.co/inmPbcRzjG",
                        "type":            "photo",
                        "sizes":           {
                            "large":  {"h": 1536, "w": 2048, "resize": "fit"},
                            "small":  {"h": 510, "w": 680, "resize": "fit"},
                            "thumb":  {"h": 150, "w": 150, "resize": "crop"},
                            "medium": {"h": 900, "w": 1200, "resize": "fit"}
                        },
                        "id_str":          "1437680369399209986",
                        "indices":         [210, 233],
                        "media_url":       "http://pbs.twimg.com/media/E_OqrcaXoAI_Zpu.jpg",
                        "display_url":     "pic.twitter.com/inmPbcRzjG",
                        "expanded_url":    "https://twitter.com/hertsboatrescue/status/1437680393499598849/photo/1",
                        "media_url_https": "https://pbs.twimg.com/media/E_OqrcaXoAI_Zpu.jpg"
                    }]
                },
                "display_text_range": [0, 209]
            },
            "favorite_count":            0,
            "is_quote_status":           false,
            "display_text_range":        [0, 140],
            "possibly_sensitive":        false,
            "in_reply_to_user_id":       null,
            "in_reply_to_status_id":     null,
            "in_reply_to_screen_name":   null,
            "in_reply_to_user_id_str":   null,
            "in_reply_to_status_id_str": null
        },
        "timestamp":          "2021-09-14T07:31:31.000Z",
        "id":                 "1437680393499598849",
        "location":           "{\"type\": \"GeometryCollection\", \"geometries\": [{\"type\": \"Point\", \"coordinates\": [-0.21699, 51.82974]}]}",
        "region":             "hertfordshire",
        "possibly_sensitive": 0,
        "source":             "twitter",
        "region_type":        "county",
        "hazard":             "flood",
        "warning":            0
    }];
;
const reqBody = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const invalidHazard1 = {
    hazards:    [1],
    sources:    [
        "twitter"
    ],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const invalidHazard2 = {
    hazards:    [],
    sources:    [
        "twitter"
    ],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
describe("POST /v1/map/:map/text", () => {
    it("single region", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(reqBody);
        console.log(JSON.stringify(response.body));
        expect(JSON.stringify(response.body)).to.equal(JSON.stringify(singleRegion));
    });
    it("invalid map", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test2/text")
            .set("Accept", "application/json")
            .send(reqBody);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("map");
    });
    it("invalid hazard 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidHazard1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("hazards");
    });
    it("invalid hazard 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidHazard2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("hazards");
    });
});
