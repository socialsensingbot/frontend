/*
 * © 2020 All rights reserved.
 */

export class QueryMetadataSets {

  private regions1: Promise<string[]>;
  private regions2: Promise<string[]>;
  private regions3: Promise<string[]>;

  constructor(connection: any) {
    this.regions1 = this.inferLocationMetadata(connection, "region_1");
    this.regions2 = this.inferLocationMetadata(connection, "region_2");
    this.regions3 = this.inferLocationMetadata(connection, "region_3");
     }

  private toTitleCase(str: string) {
    return str.replace(
      /\w\S*/g,
       (txt) => {
        if (["and", "of"].includes(txt)) {
          return txt;
        } else {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();

        }
      }
    );
  }

  private inferLocationMetadata(connection: any, field: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      connection.query({
                         sql:
                           `SELECT ${field} as text, ${field} as value
                              FROM text_by_region
                              WHERE ${field} IS NOT NULL
                              GROUP BY ${field}
                              ORDER BY ${field} ASC`,
                         values: []
                       },
                       (results, error) => {
                         if (error) {
                           reject(error);
                         } else {
                           resolve(results.map(i => {
                             i.text = this.toTitleCase(i.text);
                             return i;
                           }));
                         }
                       });
    });
  }
}
