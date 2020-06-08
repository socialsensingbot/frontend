import {EventEmitter, Injectable} from '@angular/core';
import {Observable, Subscription, timer} from "rxjs";
import {Auth, Logger} from "aws-amplify";
import {NotificationService} from "./notification.service";

const log = new Logger('uiexecution');

class ExecutionTask {

  constructor(private _resolve: (value?: any) => void, private _reject: (reason?: any) => void,
              private _task: () => any, public name: String, public waitForStates: UIState[] | null,
              private _dedup: string, private _notify: NotificationService) {

  }


  get dedup(): string {
    return this._dedup;
  }

  public execute() {
    try {
      log.info("Executing " + this.name)
      this._resolve(this._task());
    } catch (e) {
      log.error("ERROR Executing " + this.name)
      this._notify.error(e);
      this._reject(e);
    }
  }
}

export type UIState = "init" | "map-init" | "data-loaded" | "ready" | "no-params" | "data-refresh" | "data-load-failed";

export const DUPLICATE_REASON = "duplicate";

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

  private _queue: ExecutionTask[] = [];
  private _executionTimer: Subscription;
  private _pause: boolean;
  private _state: UIState = "init";
  public state = new EventEmitter<UIState>();

  private dedupMap: Map<any, ExecutionTask> = new Map<any, ExecutionTask>();

  constructor(private _notify: NotificationService) { }

  public async start() {
    await Auth.currentAuthenticatedUser() !== null
    this._executionTimer = timer(0, 100).subscribe(() => {
      while (this._queue.length > 0 && !this._pause) {
        const task = this._queue.shift();

        if (task.waitForStates === null || task.waitForStates.indexOf(this._state) >= 0) {
          task.execute()
          if (task.dedup !== null) {
            this.dedupMap.delete(task.dedup);
          }
        } else {
          log.warn(
            `Skipped out of sequence task ${task.name} on execution queue, state ${this._state} should be one of ${task.waitForStates}`)
          // this._queue.push(task)
        }
      }


    });
  }

  public stop() {
    this._executionTimer.unsubscribe();
  }

  public pause() {
    this._pause = true;
  }

  public unpause() {
    this._pause = false;

  }

  public queue(name: String, waitForStates: UIState[] | null, task: () => any, dedup: any = null) {

    return new Promise<any>((resolve, reject) => {
      let dedupKey = null;
      if (dedup !== null) {
        dedupKey = name + ":" + dedup;

      }
      const executionTask = new ExecutionTask(resolve, reject, task, name, waitForStates, dedupKey, this._notify);
      if (dedupKey !== null) {
        if (this.dedupMap.has(dedupKey)) {
          if (replace) {
            if (!silent) {
              log.warn(`Replacing duplicate ${name} (${dedupKey}) on execution queue`);
            }
            const oldTask = this.dedupMap.get(dedupKey);
            this._queue = this._queue.filter(i => i.dedup !== oldTask.dedup);
            this.dedupMap.set(dedupKey, executionTask);
          } else {
            if (silent) {
              resolve();
            } else {
              log.warn(
                `Skipped duplicate ${name} (${dedupKey}) on execution queue as this task is already queued.`);
              reject(DUPLICATE_REASON);
            }
            return;
          }
        } else {
          this.dedupMap.set(dedupKey, executionTask);
        }
      }
      this._queue.push(executionTask);
      log.debug(`Added ${name} to queue`);
    });
  }

  public changeState(newState: UIState) {
    this._state = newState;
    this.state.emit(newState);
    log.info("*** STATE " + newState.toUpperCase().replace("-", " ") + " ***");
  }
}
