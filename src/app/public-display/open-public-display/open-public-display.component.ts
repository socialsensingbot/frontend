import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";

@Component({
               selector:    'app-open-public-display',
               templateUrl: './open-public-display.component.html',
               styleUrls:   ['./open-public-display.component.scss']
           })
export class OpenPublicDisplayComponent implements OnInit {
    form = new FormGroup({
                             step:   new FormControl(1.0),
                             window: new FormControl(6),
                             speed:  new FormControl(5),
                         });

    constructor() {
    }

    ngOnInit(): void {
    }

    public getErrorMessage(): any {

    }

    public speedLabel(value: number): any {
        return value;
    }
}
