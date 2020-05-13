import { Injectable } from '@angular/core';
import {Observable, Subscription, timer} from "rxjs";
import {Auth, Logger} from "aws-amplify";

const log = new Logger('uiexecution');
class ExecutionTask {
  constructor(private _resolve: (value?: any) => void, private _reject: (reason?: any) => void,
              private _task: () => any, public name: String, public waitForStates: UIState[]|null) {

  }

  public execute() {
    try {
      log.info("Executing "+this.name)
      this._resolve(this._task());
    } catch (e) {
      log.error("ERROR Executing "+this.name)
      log.error(e);
      this._reject(e);
    }
  }
}

type UIState= "init"|"map-init"|"data-loaded"|"ready"|"no-params"|"data-refresh"|"data-load-failed";

/**
 * The UIExecutionService is responsible for making sure
 * certain tasks are executed in serial and that they are only executed
 * if the internal state machine is in the correct state.
 *
 * The effect of this is to give a deterministic start up process.
 */
@Injectable({
  providedIn: 'root'
})
export class UIExecutionService {

  private _queue: ExecutionTask[]=[];
  private _executionTimer:Subscription;
  private _pause: boolean;
  private _state: UIState="init";

  constructor() { }

  public async start() {
    await Auth.currentAuthenticatedUser() !== null
    this._executionTimer = timer(0, 100).subscribe(() => {
      if(this._queue.length > 0 && !this._pause) {
        const task = this._queue.shift();
        if(task.waitForStates === null || task.waitForStates.indexOf(this._state) >= 0) {
          task.execute()
        } else {
          console.error(`Skipped out of sequence task ${task.name} on execution queue, state ${this._state} should be one of ${task.waitForStates}`)
          // this._queue.push(task)
        }

      }

    });
  }

  public stop() {
    this._executionTimer.unsubscribe();
  }

  public pause() {
    this._pause= true;
  }

  public unpause() {
    this._pause= false;

  }
  public queue(name:String,waitForStates:UIState[]|null,task:()=>any) {
    return new Promise<any>((resolve,reject)=> {
      this._queue.push(new ExecutionTask(resolve,reject,task,name,waitForStates));
      log.debug(`Added ${name} to queue`);
    })
  }

  public state(state:UIState) {
    this._state= state;
    log.info("*** STATE "+state.toUpperCase().replace("-"," ")+" ***");
  }
}
