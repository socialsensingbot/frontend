import {MAP_URL, MAX_DATE_MILLIS, MIN_DATE_MILLIS} from "../../../support";


//TODO move to fixtures
const expect_3_region_csv = [
    [
        "﻿region",
        "impact",
        "source",
        "id",
        "date",
        "url",
        "text",
        "location"
    ],
    [
        "West Yorkshire",
        "",
        "",
        "1437928769545809922",
        "Tue, 14 Sep 2021 23:58:28 GMT",
        "https://twitter.com/username_removed/status/1437928769545809922",
        "We only later found out about the £3m bung, Perssimon Homes gave to Bradford Council to help carry out works which are now ongoing. Causing major traffic problems at Greengates traffic lights. So not only is it now causing flooding in Thackley,we now have serious driving problems",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [-1.83333, 53.83333]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437889753949560835",
        "Tue, 14 Sep 2021 21:23:26 GMT",
        "https://twitter.com/username_removed/status/1437889753949560835",
        "It's OK, this is a nothingburger really. The flood-water won't get further than the tow-paths in Cambridge.",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.11667, 52.2]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437878018714837011",
        "Tue, 14 Sep 2021 20:36:48 GMT",
        "https://twitter.com/username_removed/status/1437878018714837011",
        "It is now, thank you Jago, finally stopped raining about 7:30 so hopefully will stay long enough for all the floodwaters to drain away. Luckily it looks like it was just roads flooded and not houses or businesses this time! 💕",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.00433, 52.36717]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437870075546161159",
        "Tue, 14 Sep 2021 20:05:15 GMT",
        "https://twitter.com/username_removed/status/1437870075546161159",
        "We are thank you, fortunately we believe it's just been roads flooded and no houses or businesses this time!",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.00433, 52.36717]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437869178187300864",
        "Tue, 14 Sep 2021 20:01:41 GMT",
        "https://twitter.com/username_removed/status/1437869178187300864",
        "Thank you! We were okay, several roads flooded nearby but we stayed safe fortunately and I think the rain has passed which should give the stream waters time to recede.",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.00433, 52.36717]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437868858929471494",
        "Tue, 14 Sep 2021 20:00:24 GMT",
        "https://twitter.com/username_removed/status/1437868858929471494",
        "Thanks Ozzy, it's finally stopped raining but it real torrential rain from early this morning (pre 6am) and didn't ease until this evening. Several roads were flooded but fortunately we were okay. Mum had to drive through a flooded road to pick Nanna up from lunch with friends!",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.00433, 52.36717]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437866416414380033",
        "Tue, 14 Sep 2021 19:50:42 GMT",
        "https://twitter.com/username_removed/status/1437866416414380033",
        "We all got home safely, Mum had to drive on the wrong side of the road through a flooded bit of road as it was shallower, but the cars were okay as long as they drove slowly. The rain’s eased off now fortunately and it should be dry tomorrow which will ease the river levels 💕",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.00433, 52.36717]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437865850573402120",
        "Tue, 14 Sep 2021 19:48:27 GMT",
        "https://twitter.com/username_removed/status/1437865850573402120",
        "They showed this on our news, luckily we have nothing underground here but Mum did have to drive through a flooded road to pick Nanna up, it was okay as long as all the cars drove slowly and took turns on the right hand side of the road.",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.00433, 52.36717]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437865410418909199",
        "Tue, 14 Sep 2021 19:46:42 GMT",
        "https://twitter.com/username_removed/status/1437865410418909199",
        "Thank you, it’s eased off now, thankfully. Mum had t9 drive through a flooded road to pick Nanna up, although as long as all,cars drove slowly and took turns in the right hand side of the road they could get though.",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.00433, 52.36717]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437864733286277123",
        "Tue, 14 Sep 2021 19:44:01 GMT",
        "https://twitter.com/username_removed/status/1437864733286277123",
        "Thank you Oreo, it’s eased off now, thankfully. One of the roads she had to drive through to pick Nanna up was completely flooded, although not too deep that cars couldn’t get through if they drove slowly and stayed on the right hand side of the road!",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.00433, 52.36717]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437851039793876995",
        "Tue, 14 Sep 2021 18:49:36 GMT",
        "https://twitter.com/username_removed/status/1437851039793876995",
        "Pouring down here in South Cambridgeshire all day, Many roads flooded. It was warm at least",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.105, 52.132]}]}\""
    ],
    [
        "West Yorkshire",
        "",
        "",
        "1437796082969464840",
        "Tue, 14 Sep 2021 15:11:13 GMT",
        "https://twitter.com/username_removed/status/1437796082969464840",
        "When did this country become so unable to manage rain?Video shows Tower Bridge flooded after torrential rain in Londonhttps://t.co/EiHYEBCZzwSent via @USERNAME_REMOVED",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Polygon\\\", \\\"coordinates\\\": [[[-1.696336, 53.773415], [-1.696336, 53.858452], [-1.837304, 53.858452], [-1.837304, 53.773415], [-1.696336, 53.773415]]]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437794161424482305",
        "Tue, 14 Sep 2021 15:03:35 GMT",
        "https://twitter.com/username_removed/status/1437794161424482305",
        "Very wet. Fenland is flooding....",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.049, 52.575]}]}\""
    ],
    [
        "West Yorkshire",
        "",
        "",
        "1437787273320443918",
        "Tue, 14 Sep 2021 14:36:13 GMT",
        "https://twitter.com/username_removed/status/1437787273320443918",
        "It's run off on the pedestrian walkway so and there's guttering on either side of the road so not likely. I suspect, it's a flash flood, which are generally becoming more common.",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [-1.54785, 53.79648]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437772960488689667",
        "Tue, 14 Sep 2021 13:39:20 GMT",
        "https://twitter.com/username_removed/status/1437772960488689667",
        "A woman in our area had sewage flooding into her house two Christmas’ ago…now she’s wishing the whole village has to experience the same…because anglian water  cancelled some water work. Honestly the spite of some people 😂🤦🏼‍♀️",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.11667, 52.2]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437769135249821698",
        "Tue, 14 Sep 2021 13:24:08 GMT",
        "https://twitter.com/username_removed/status/1437769135249821698",
        "Hi Russ. Does that include a flooded ticket office? 😨Whereabouts at Cambridge station may I currently purchase a travel card? Can you confirm there is a temporary selling arrangement in place today, please.",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.11667, 52.2]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437765370480402436",
        "Tue, 14 Sep 2021 13:09:11 GMT",
        "https://twitter.com/username_removed/status/1437765370480402436",
        "Heavy rain is continuing to fall across the county. To report flooding problems on roads or pavements (e.g. blocked drains and gullies), please use our highway reporting tool: https://t.co/Z30ZWwR9oq More on our website: https://t.co/ZbU64gHrAQ",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.00433, 52.36717]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437762166715731973",
        "Tue, 14 Sep 2021 12:56:27 GMT",
        "https://twitter.com/username_removed/status/1437762166715731973",
        "as the road between us and that village is one of those which is flooded. The pub was even further away but they should be able to get from there to her friends house okay.",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.00433, 52.36717]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437750113833738240",
        "Tue, 14 Sep 2021 12:08:33 GMT",
        "https://twitter.com/username_removed/status/1437750113833738240",
        "Thanks guys. I’ve been feeling less than great for a week now. I go straight to ground & straight home for evening games so I can leave it late to decide. Mind you my station ticket office & entrance are flooded atm 🤪",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.11667, 52.2]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437739775096725504",
        "Tue, 14 Sep 2021 11:27:28 GMT",
        "https://twitter.com/username_removed/status/1437739775096725504",
        "Cambridge station flooded. Wrong kind of rain… 🌧 ☔️ 🌧 ☔️",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.11667, 52.2]}]}\""
    ],
    [
        "Cambridgeshire",
        "",
        "",
        "1437732387882946565",
        "Tue, 14 Sep 2021 10:58:07 GMT",
        "https://twitter.com/username_removed/status/1437732387882946565",
        "⚠⚠Due to flooding CAMBRIDGE TICKET OFFICE is temporarily closed. The station can still be accessed via the side entrances as normal. We hope for this to be rectified as soon as possible.",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [0.11667, 52.2]}]}\""
    ],
    [
        "Hertfordshire",
        "",
        "",
        "1437723439423528963",
        "Tue, 14 Sep 2021 10:22:34 GMT",
        "https://twitter.com/username_removed/status/1437723439423528963",
        "Tewin Water, the clue is in the name - it floods.  My cousin lives nearby and has been affected.",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [-0.156, 51.817]}]}\""
    ],
    [
        "West Yorkshire",
        "",
        "",
        "1437721325708189696",
        "Tue, 14 Sep 2021 10:14:10 GMT",
        "https://twitter.com/username_removed/status/1437721325708189696",
        "A lot of flooding at the moment. Scary. Happy 😃 Tuesday sexy man xx 💋",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [-1.54785, 53.79648]}]}\""
    ],
    [
        "Hertfordshire",
        "",
        "",
        "1437680393499598849",
        "Tue, 14 Sep 2021 07:31:31 GMT",
        "https://twitter.com/username_removed/status/1437680393499598849",
        "With heavy #rain predicted today, there may be some localised flooding.Be #floodaware #weatheraware Don’t drive into unknown depths of #floodwater - #Drivetosurvive #hertfordshire #waterrescue #volunteers pic.twitter.com/inmPbcRzjG",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [-0.21699, 51.82974]}]}\""
    ]
];

const expect_west_yorkshire = [
    [
        "﻿region",
        "impact",
        "source",
        "id",
        "date",
        "url",
        "text",
        "location"
    ],
    [
        "West Yorkshire",
        "",
        "",
        "1437928769545809922",
        "Tue, 14 Sep 2021 23:58:28 GMT",
        "https://twitter.com/username_removed/status/1437928769545809922",
        "We only later found out about the £3m bung, Perssimon Homes gave to Bradford Council to help carry out works which are now ongoing. Causing major traffic problems at Greengates traffic lights. So not only is it now causing flooding in Thackley,we now have serious driving problems",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [-1.83333, 53.83333]}]}\""
    ],
    [
        "West Yorkshire",
        "",
        "",
        "1437796082969464840",
        "Tue, 14 Sep 2021 15:11:13 GMT",
        "https://twitter.com/username_removed/status/1437796082969464840",
        "When did this country become so unable to manage rain?Video shows Tower Bridge flooded after torrential rain in Londonhttps://t.co/EiHYEBCZzwSent via @USERNAME_REMOVED",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Polygon\\\", \\\"coordinates\\\": [[[-1.696336, 53.773415], [-1.696336, 53.858452], [-1.837304, 53.858452], [-1.837304, 53.773415], [-1.696336, 53.773415]]]}]}\""
    ],
    [
        "West Yorkshire",
        "",
        "",
        "1437787273320443918",
        "Tue, 14 Sep 2021 14:36:13 GMT",
        "https://twitter.com/username_removed/status/1437787273320443918",
        "It's run off on the pedestrian walkway so and there's guttering on either side of the road so not likely. I suspect, it's a flash flood, which are generally becoming more common.",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [-1.54785, 53.79648]}]}\""
    ],
    [
        "West Yorkshire",
        "",
        "",
        "1437721325708189696",
        "Tue, 14 Sep 2021 10:14:10 GMT",
        "https://twitter.com/username_removed/status/1437721325708189696",
        "A lot of flooding at the moment. Scary. Happy 😃 Tuesday sexy man xx 💋",
        "\"{\\\"type\\\": \\\"GeometryCollection\\\", \\\"geometries\\\": [{\\\"type\\\": \\\"Point\\\", \\\"coordinates\\\": [-1.54785, 53.79648]}]}\""
    ]
];


describe('#422 CSV Download Tests : https://github.com/socialsensingbot/frontend/issues/422',
         function () {
             beforeEach(function () {
                 cy.visit(MAP_URL);
                 cy.login();
             });


             it('Select manually', () => {
                 const url = MAP_URL + "?active_number=stats&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=west%20yorkshire";
                 cy.visitAndWait(url);
                 cy.get(`div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-west-yorkshire[stroke-width=3]`);
                 cy.wait(2000);
                 cy.twitterPanelHeader("West Yorkshire");
                 cy.get(".app-tweet-export-btn").click();
                 cy.validateCsvFile("west_yorkshire*.csv", (list) => {
                     console.log(JSON.stringify(list));
                     console.log("list", list)
                     cy.log(list);
                     expect(list).to.deep.equal(expect_west_yorkshire);
                 });
                 cy.multiSelectRegions(["cambridgeshire", "hertfordshire"]);
                 cy.twitterPanelHeader("3 regions selected");
                 cy.tweetCountTotal(24);

                 cy.get(".app-tweet-export-btn").click();
                 cy.validateCsvFile("multiple-regions*.csv", (list) => {
                     console.log(JSON.stringify(list));
                     console.log("list", list)
                     cy.log(list);
                     expect(list).to.deep.equal(expect_3_region_csv);
                 })
             });

             //
             // it('Select from URL', () => {
             //     const url = MAP_URL + "?active_number=stats&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=cambridgeshire&selected=hertfordshire&selected=west%20yorkshire";
             //     cy.visitAndWait(url);
             //     cy.wait(10000);
             //     cy.twitterPanelHeader("3 regions selected");
             //     cy.tweetCountTotal(28);
             //     for (let county of ["cambridgeshire", "hertfordshire", "west-yorkshire"]) {
             //         cy.get(`div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-${county}[stroke-width=3]`);
             //     }
             // });
         });
