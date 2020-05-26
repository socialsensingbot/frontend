import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor( private _router: Router  ) { }

  ngOnInit() {

    console.error("Ended up at the home component ...?");
    this._router.navigate(['/map'], {queryParamsHandling: "merge"});
  }

}
