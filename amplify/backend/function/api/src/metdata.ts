/*
 * © 2020 All rights reserved.
 */

export class QueryMetadataSets {

    private regions: Promise<any[]>;

    constructor(connection: any) {
        this.regions = new Promise((resolve, reject) => {
            connection.query({
                                 sql:
                                     `SELECT title as text, id as value, aggregate_level as level
                                      FROM ref_regions`,
                                 values: []
                             },
                             (error, results) => {
                                 if (error) {
                                     reject(error);
                                 } else {
                                     resolve(results);
                                 }
                             });
        });

    }

}
