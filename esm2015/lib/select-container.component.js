/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Component, ElementRef, Output, EventEmitter, Input, Renderer2, ViewChild, NgZone, ContentChildren, QueryList, HostBinding, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, combineLatest, merge, from, fromEvent, BehaviorSubject, asyncScheduler } from 'rxjs';
import { switchMap, takeUntil, map, tap, filter, auditTime, mapTo, share, withLatestFrom, distinctUntilChanged, observeOn, startWith, concatMapTo, first } from 'rxjs/operators';
import { SelectItemDirective, SELECT_ITEM_INSTANCE } from './select-item.directive';
import { ShortcutService } from './shortcut.service';
import { createSelectBox, whenSelectBoxVisible } from './operators';
import { Action, UpdateActions } from './models';
import { AUDIT_TIME, NO_SELECT_CLASS } from './constants';
import { inBoundingBox, cursorWithinElement, clearSelection, boxIntersects, calculateBoundingClientRect, getRelativeMousePosition, getMousePosition, hasMinimumSize } from './utils';
import { KeyboardEventsService } from './keyboard-events.service';
export class SelectContainerComponent {
    /**
     * @param {?} platformId
     * @param {?} shortcuts
     * @param {?} keyboardEvents
     * @param {?} hostElementRef
     * @param {?} renderer
     * @param {?} ngZone
     */
    constructor(platformId, shortcuts, keyboardEvents, hostElementRef, renderer, ngZone) {
        this.platformId = platformId;
        this.shortcuts = shortcuts;
        this.keyboardEvents = keyboardEvents;
        this.hostElementRef = hostElementRef;
        this.renderer = renderer;
        this.ngZone = ngZone;
        this.selectOnDrag = true;
        this.disabled = false;
        this.disableDrag = false;
        this.disableRangeSelection = false;
        this.selectMode = false;
        this.selectWithShortcut = false;
        this.custom = false;
        this.selectedItemsChange = new EventEmitter();
        this.select = new EventEmitter();
        this.itemSelected = new EventEmitter();
        this.itemDeselected = new EventEmitter();
        this.selectionStarted = new EventEmitter();
        this.selectionEnded = new EventEmitter();
        this._tmpItems = new Map();
        this._selectedItems$ = new BehaviorSubject([]);
        this._selectableItems = [];
        this.updateItems$ = new Subject();
        this.destroy$ = new Subject();
        this._lastRange = [-1, -1];
        this._lastStartIndex = undefined;
        this._newRangeStart = false;
        this._lastRangeSelection = new Map();
    }
    /**
     * @return {?}
     */
    ngAfterViewInit() {
        if (isPlatformBrowser(this.platformId)) {
            this.host = this.hostElementRef.nativeElement;
            this._initSelectedItemsChange();
            this._calculateBoundingClientRect();
            this._observeBoundingRectChanges();
            this._observeSelectableItems();
            /** @type {?} */
            const mouseup$ = this.keyboardEvents.mouseup$.pipe(filter((/**
             * @return {?}
             */
            () => !this.disabled)), tap((/**
             * @return {?}
             */
            () => this._onMouseUp())), share());
            /** @type {?} */
            const mousemove$ = this.keyboardEvents.mousemove$.pipe(filter((/**
             * @return {?}
             */
            () => !this.disabled)), share());
            /** @type {?} */
            const mousedown$ = fromEvent(this.host, 'mousedown').pipe(filter((/**
             * @param {?} event
             * @return {?}
             */
            event => event.button === 0)), // only emit left mouse
            filter((/**
             * @return {?}
             */
            () => !this.disabled)), tap((/**
             * @param {?} event
             * @return {?}
             */
            event => this._onMouseDown(event))), share());
            /** @type {?} */
            const dragging$ = mousedown$.pipe(filter((/**
             * @param {?} event
             * @return {?}
             */
            event => !this.shortcuts.disableSelection(event))), filter((/**
             * @return {?}
             */
            () => !this.selectMode)), filter((/**
             * @return {?}
             */
            () => !this.disableDrag)), switchMap((/**
             * @return {?}
             */
            () => mousemove$.pipe(takeUntil(mouseup$)))), share());
            /** @type {?} */
            const currentMousePosition$ = mousedown$.pipe(map((/**
             * @param {?} event
             * @return {?}
             */
            (event) => getRelativeMousePosition(event, this.host))));
            /** @type {?} */
            const show$ = dragging$.pipe(mapTo(1));
            /** @type {?} */
            const hide$ = mouseup$.pipe(mapTo(0));
            /** @type {?} */
            const opacity$ = merge(show$, hide$).pipe(distinctUntilChanged());
            /** @type {?} */
            const selectBox$ = combineLatest([dragging$, opacity$, currentMousePosition$]).pipe(createSelectBox(this.host), share());
            this.selectBoxClasses$ = merge(dragging$, mouseup$, this.keyboardEvents.distinctKeydown$, this.keyboardEvents.distinctKeyup$).pipe(auditTime(AUDIT_TIME), withLatestFrom(selectBox$), map((/**
             * @param {?} __0
             * @return {?}
             */
            ([event, selectBox]) => {
                return {
                    'dts-adding': hasMinimumSize(selectBox, 0, 0) && !this.shortcuts.removeFromSelection(event),
                    'dts-removing': this.shortcuts.removeFromSelection(event)
                };
            })), distinctUntilChanged((/**
             * @param {?} a
             * @param {?} b
             * @return {?}
             */
            (a, b) => JSON.stringify(a) === JSON.stringify(b))));
            /** @type {?} */
            const selectOnMouseUp$ = dragging$.pipe(filter((/**
             * @return {?}
             */
            () => !this.selectOnDrag)), filter((/**
             * @return {?}
             */
            () => !this.selectMode)), filter((/**
             * @param {?} event
             * @return {?}
             */
            event => this._cursorWithinHost(event))), switchMap((/**
             * @param {?} _
             * @return {?}
             */
            _ => mouseup$.pipe(first()))), filter((/**
             * @param {?} event
             * @return {?}
             */
            event => (!this.shortcuts.disableSelection(event) && !this.shortcuts.toggleSingleItem(event)) ||
                this.shortcuts.removeFromSelection(event))));
            /** @type {?} */
            const selectOnDrag$ = selectBox$.pipe(auditTime(AUDIT_TIME), withLatestFrom(mousemove$, (/**
             * @param {?} selectBox
             * @param {?} event
             * @return {?}
             */
            (selectBox, event) => ({
                selectBox,
                event
            }))), filter((/**
             * @return {?}
             */
            () => this.selectOnDrag)), filter((/**
             * @param {?} __0
             * @return {?}
             */
            ({ selectBox }) => hasMinimumSize(selectBox))), map((/**
             * @param {?} __0
             * @return {?}
             */
            ({ event }) => event)));
            /** @type {?} */
            const selectOnKeyboardEvent$ = merge(this.keyboardEvents.distinctKeydown$, this.keyboardEvents.distinctKeyup$).pipe(auditTime(AUDIT_TIME), whenSelectBoxVisible(selectBox$), tap((/**
             * @param {?} event
             * @return {?}
             */
            event => {
                if (this._isExtendedSelection(event)) {
                    this._tmpItems.clear();
                }
                else {
                    this._flushItems();
                }
            })));
            merge(selectOnMouseUp$, selectOnDrag$, selectOnKeyboardEvent$)
                .pipe(takeUntil(this.destroy$))
                .subscribe((/**
             * @param {?} event
             * @return {?}
             */
            event => this._selectItems(event)));
            this.selectBoxStyles$ = selectBox$.pipe(map((/**
             * @param {?} selectBox
             * @return {?}
             */
            selectBox => ({
                top: `${selectBox.top}px`,
                left: `${selectBox.left}px`,
                width: `${selectBox.width}px`,
                height: `${selectBox.height}px`,
                opacity: selectBox.opacity
            }))));
            this._initSelectionOutputs(mousedown$, mouseup$);
        }
    }
    /**
     * @return {?}
     */
    ngAfterContentInit() {
        this._selectableItems = this.$selectableItems.toArray();
    }
    /**
     * @return {?}
     */
    selectAll() {
        this.$selectableItems.forEach((/**
         * @param {?} item
         * @return {?}
         */
        item => {
            this._selectItem(item);
        }));
    }
    /**
     * @template T
     * @param {?} predicate
     * @return {?}
     */
    toggleItems(predicate) {
        this._filterSelectableItems(predicate).subscribe((/**
         * @param {?} item
         * @return {?}
         */
        (item) => this._toggleItem(item)));
    }
    /**
     * @template T
     * @param {?} predicate
     * @return {?}
     */
    selectItems(predicate) {
        this._filterSelectableItems(predicate).subscribe((/**
         * @param {?} item
         * @return {?}
         */
        (item) => this._selectItem(item)));
    }
    /**
     * @template T
     * @param {?} predicate
     * @return {?}
     */
    deselectItems(predicate) {
        this._filterSelectableItems(predicate).subscribe((/**
         * @param {?} item
         * @return {?}
         */
        (item) => this._deselectItem(item)));
    }
    /**
     * @return {?}
     */
    clearSelection() {
        this.$selectableItems.forEach((/**
         * @param {?} item
         * @return {?}
         */
        item => {
            this._deselectItem(item);
        }));
    }
    /**
     * @return {?}
     */
    update() {
        this._calculateBoundingClientRect();
        this.$selectableItems.forEach((/**
         * @param {?} item
         * @return {?}
         */
        item => item.calculateBoundingClientRect()));
    }
    /**
     * @param {?} startIndex
     * @param {?} endIndex
     * @return {?}
     */
    selectRange(startIndex, endIndex) {
        this.$selectableItems.forEach((/**
         * @param {?} item
         * @param {?} index
         * @return {?}
         */
        (item, index) => {
            if (index >= startIndex && index <= endIndex) {
                this._selectItem(item);
            }
            else {
                this._deselectItem(item);
            }
        }));
    }
    /**
     * @param {?} indexArray
     * @return {?}
     */
    selectArray(indexArray) {
        this.$selectableItems.forEach((/**
         * @param {?} item
         * @param {?} index
         * @return {?}
         */
        (item, index) => {
            if (indexArray.includes(index)) {
                this._selectItem(item);
            }
            else {
                this._deselectItem(item);
            }
        }));
    }
    /**
     * @return {?}
     */
    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }
    /**
     * @private
     * @template T
     * @param {?} predicate
     * @return {?}
     */
    _filterSelectableItems(predicate) {
        // Wrap select items in an observable for better efficiency as
        // no intermediate arrays are created and we only need to process
        // every item once.
        return from(this._selectableItems).pipe(filter((/**
         * @param {?} item
         * @return {?}
         */
        item => predicate(item.value))));
    }
    /**
     * @private
     * @return {?}
     */
    _initSelectedItemsChange() {
        this._selectedItems$.pipe(auditTime(AUDIT_TIME), takeUntil(this.destroy$)).subscribe({
            next: (/**
             * @param {?} selectedItems
             * @return {?}
             */
            selectedItems => {
                this.selectedItemsChange.emit(selectedItems);
                this.select.emit(selectedItems);
            }),
            complete: (/**
             * @return {?}
             */
            () => {
                this.selectedItemsChange.emit([]);
            })
        });
    }
    /**
     * @private
     * @return {?}
     */
    _observeSelectableItems() {
        // Listen for updates and either select or deselect an item
        this.updateItems$
            .pipe(withLatestFrom(this._selectedItems$), takeUntil(this.destroy$))
            .subscribe((/**
         * @param {?} __0
         * @return {?}
         */
        ([update, selectedItems]) => {
            /** @type {?} */
            const item = update.item;
            switch (update.type) {
                case UpdateActions.Add:
                    if (this._addItem(item, selectedItems)) {
                        item._select();
                    }
                    break;
                case UpdateActions.Remove:
                    if (this._removeItem(item, selectedItems)) {
                        item._deselect();
                    }
                    break;
            }
        }));
        // Update the container as well as all selectable items if the list has changed
        this.$selectableItems.changes
            .pipe(withLatestFrom(this._selectedItems$), observeOn(asyncScheduler), takeUntil(this.destroy$))
            .subscribe((/**
         * @param {?} __0
         * @return {?}
         */
        ([items, selectedItems]) => {
            /** @type {?} */
            const newList = items.toArray();
            this._selectableItems = newList;
            /** @type {?} */
            const removedItems = selectedItems.filter((/**
             * @param {?} item
             * @return {?}
             */
            item => !newList.includes(item.value)));
            if (removedItems.length) {
                removedItems.forEach((/**
                 * @param {?} item
                 * @return {?}
                 */
                item => this._removeItem(item, selectedItems)));
            }
            this.update();
        }));
    }
    /**
     * @private
     * @return {?}
     */
    _observeBoundingRectChanges() {
        this.ngZone.runOutsideAngular((/**
         * @return {?}
         */
        () => {
            /** @type {?} */
            const resize$ = fromEvent(window, 'resize');
            /** @type {?} */
            const windowScroll$ = fromEvent(window, 'scroll');
            /** @type {?} */
            const containerScroll$ = fromEvent(this.host, 'scroll');
            merge(resize$, windowScroll$, containerScroll$)
                .pipe(startWith('INITIAL_UPDATE'), auditTime(AUDIT_TIME), takeUntil(this.destroy$))
                .subscribe((/**
             * @return {?}
             */
            () => {
                this.update();
            }));
        }));
    }
    /**
     * @private
     * @param {?} mousedown$
     * @param {?} mouseup$
     * @return {?}
     */
    _initSelectionOutputs(mousedown$, mouseup$) {
        mousedown$
            .pipe(filter((/**
         * @param {?} event
         * @return {?}
         */
        event => this._cursorWithinHost(event))), tap((/**
         * @return {?}
         */
        () => this.selectionStarted.emit())), concatMapTo(mouseup$.pipe(first())), withLatestFrom(this._selectedItems$), map((/**
         * @param {?} __0
         * @return {?}
         */
        ([, items]) => items)), takeUntil(this.destroy$))
            .subscribe((/**
         * @param {?} items
         * @return {?}
         */
        items => {
            this.selectionEnded.emit(items);
        }));
    }
    /**
     * @private
     * @return {?}
     */
    _calculateBoundingClientRect() {
        this.host.boundingClientRect = calculateBoundingClientRect(this.host);
    }
    /**
     * @private
     * @param {?} event
     * @return {?}
     */
    _cursorWithinHost(event) {
        return cursorWithinElement(event, this.host);
    }
    /**
     * @private
     * @return {?}
     */
    _onMouseUp() {
        this._flushItems();
        this.renderer.removeClass(document.body, NO_SELECT_CLASS);
    }
    /**
     * @private
     * @param {?} event
     * @return {?}
     */
    _onMouseDown(event) {
        if (this.shortcuts.disableSelection(event) || this.disabled) {
            return;
        }
        clearSelection(window);
        if (!this.disableDrag) {
            this.renderer.addClass(document.body, NO_SELECT_CLASS);
        }
        if (this.shortcuts.removeFromSelection(event)) {
            return;
        }
        /** @type {?} */
        const mousePoint = getMousePosition(event);
        const [currentIndex, clickedItem] = this._getClosestSelectItem(event);
        let [startIndex, endIndex] = this._lastRange;
        /** @type {?} */
        const isMoveRangeStart = this.shortcuts.moveRangeStart(event);
        /** @type {?} */
        const shouldResetRangeSelection = !this.shortcuts.extendedSelectionShortcut(event) || isMoveRangeStart || this.disableRangeSelection;
        if (shouldResetRangeSelection) {
            this._resetRangeStart();
        }
        // move range start
        if (shouldResetRangeSelection && !this.disableRangeSelection) {
            if (currentIndex > -1) {
                this._newRangeStart = true;
                this._lastStartIndex = currentIndex;
                clickedItem.toggleRangeStart();
                this._lastRangeSelection.clear();
            }
            else {
                this._lastStartIndex = -1;
            }
        }
        if (currentIndex > -1) {
            startIndex = Math.min(this._lastStartIndex, currentIndex);
            endIndex = Math.max(this._lastStartIndex, currentIndex);
            this._lastRange = [startIndex, endIndex];
        }
        if (isMoveRangeStart) {
            return;
        }
        this.$selectableItems.forEach((/**
         * @param {?} item
         * @param {?} index
         * @return {?}
         */
        (item, index) => {
            /** @type {?} */
            const itemRect = item.getBoundingClientRect();
            /** @type {?} */
            const withinBoundingBox = inBoundingBox(mousePoint, itemRect);
            if (this.shortcuts.extendedSelectionShortcut(event) && this.disableRangeSelection) {
                return;
            }
            /** @type {?} */
            const withinRange = this.shortcuts.extendedSelectionShortcut(event) &&
                startIndex > -1 &&
                endIndex > -1 &&
                index >= startIndex &&
                index <= endIndex &&
                startIndex !== endIndex;
            /** @type {?} */
            const shouldAdd = (withinBoundingBox &&
                !this.shortcuts.toggleSingleItem(event) &&
                !this.selectMode &&
                !this.selectWithShortcut) ||
                (this.shortcuts.extendedSelectionShortcut(event) && item.selected && !this._lastRangeSelection.get(item)) ||
                withinRange ||
                (withinBoundingBox && this.shortcuts.toggleSingleItem(event) && !item.selected) ||
                (!withinBoundingBox && this.shortcuts.toggleSingleItem(event) && item.selected) ||
                (withinBoundingBox && !item.selected && this.selectMode) ||
                (!withinBoundingBox && item.selected && this.selectMode);
            /** @type {?} */
            const shouldRemove = (!withinBoundingBox &&
                !this.shortcuts.toggleSingleItem(event) &&
                !this.selectMode &&
                !this.shortcuts.extendedSelectionShortcut(event) &&
                !this.selectWithShortcut) ||
                (this.shortcuts.extendedSelectionShortcut(event) && currentIndex > -1) ||
                (!withinBoundingBox && this.shortcuts.toggleSingleItem(event) && !item.selected) ||
                (withinBoundingBox && this.shortcuts.toggleSingleItem(event) && item.selected) ||
                (!withinBoundingBox && !item.selected && this.selectMode) ||
                (withinBoundingBox && item.selected && this.selectMode);
            if (shouldAdd) {
                this._selectItem(item);
            }
            else if (shouldRemove) {
                this._deselectItem(item);
            }
            if (withinRange && !this._lastRangeSelection.get(item)) {
                this._lastRangeSelection.set(item, true);
            }
            else if (!withinRange && !this._newRangeStart && !item.selected) {
                this._lastRangeSelection.delete(item);
            }
        }));
        // if we don't toggle a single item, we set `newRangeStart` to `false`
        // meaning that we are building up a range
        if (!this.shortcuts.toggleSingleItem(event)) {
            this._newRangeStart = false;
        }
    }
    /**
     * @private
     * @param {?} event
     * @return {?}
     */
    _selectItems(event) {
        /** @type {?} */
        const selectionBox = calculateBoundingClientRect(this.$selectBox.nativeElement);
        this.$selectableItems.forEach((/**
         * @param {?} item
         * @param {?} index
         * @return {?}
         */
        (item, index) => {
            if (this._isExtendedSelection(event)) {
                this._extendedSelectionMode(selectionBox, item, event);
            }
            else {
                this._normalSelectionMode(selectionBox, item, event);
                if (this._lastStartIndex < 0 && item.selected) {
                    item.toggleRangeStart();
                    this._lastStartIndex = index;
                }
            }
        }));
    }
    /**
     * @private
     * @param {?} event
     * @return {?}
     */
    _isExtendedSelection(event) {
        return this.shortcuts.extendedSelectionShortcut(event) && this.selectOnDrag;
    }
    /**
     * @private
     * @param {?} selectBox
     * @param {?} item
     * @param {?} event
     * @return {?}
     */
    _normalSelectionMode(selectBox, item, event) {
        /** @type {?} */
        const inSelection = boxIntersects(selectBox, item.getBoundingClientRect());
        /** @type {?} */
        const shouldAdd = inSelection && !item.selected && !this.shortcuts.removeFromSelection(event);
        /** @type {?} */
        const shouldRemove = (!inSelection && item.selected && !this.shortcuts.addToSelection(event)) ||
            (inSelection && item.selected && this.shortcuts.removeFromSelection(event));
        if (shouldAdd) {
            this._selectItem(item);
        }
        else if (shouldRemove) {
            this._deselectItem(item);
        }
    }
    /**
     * @private
     * @param {?} selectBox
     * @param {?} item
     * @param {?} event
     * @return {?}
     */
    _extendedSelectionMode(selectBox, item, event) {
        /** @type {?} */
        const inSelection = boxIntersects(selectBox, item.getBoundingClientRect());
        /** @type {?} */
        const shoudlAdd = (inSelection && !item.selected && !this.shortcuts.removeFromSelection(event) && !this._tmpItems.has(item)) ||
            (inSelection && item.selected && this.shortcuts.removeFromSelection(event) && !this._tmpItems.has(item));
        /** @type {?} */
        const shouldRemove = (!inSelection && item.selected && this.shortcuts.addToSelection(event) && this._tmpItems.has(item)) ||
            (!inSelection && !item.selected && this.shortcuts.removeFromSelection(event) && this._tmpItems.has(item));
        if (shoudlAdd) {
            item.selected ? item._deselect() : item._select();
            /** @type {?} */
            const action = this.shortcuts.removeFromSelection(event)
                ? Action.Delete
                : this.shortcuts.addToSelection(event)
                    ? Action.Add
                    : Action.None;
            this._tmpItems.set(item, action);
        }
        else if (shouldRemove) {
            this.shortcuts.removeFromSelection(event) ? item._select() : item._deselect();
            this._tmpItems.delete(item);
        }
    }
    /**
     * @private
     * @return {?}
     */
    _flushItems() {
        this._tmpItems.forEach((/**
         * @param {?} action
         * @param {?} item
         * @return {?}
         */
        (action, item) => {
            if (action === Action.Add) {
                this._selectItem(item);
            }
            if (action === Action.Delete) {
                this._deselectItem(item);
            }
        }));
        this._tmpItems.clear();
    }
    /**
     * @private
     * @param {?} item
     * @param {?} selectedItems
     * @return {?}
     */
    _addItem(item, selectedItems) {
        /** @type {?} */
        let success = false;
        if (!this._hasItem(item, selectedItems)) {
            success = true;
            selectedItems.push(item.value);
            this._selectedItems$.next(selectedItems);
            this.itemSelected.emit(item.value);
        }
        return success;
    }
    /**
     * @private
     * @param {?} item
     * @param {?} selectedItems
     * @return {?}
     */
    _removeItem(item, selectedItems) {
        /** @type {?} */
        let success = false;
        /** @type {?} */
        const value = item instanceof SelectItemDirective ? item.value : item;
        /** @type {?} */
        const index = selectedItems.indexOf(value);
        if (index > -1) {
            success = true;
            selectedItems.splice(index, 1);
            this._selectedItems$.next(selectedItems);
            this.itemDeselected.emit(item.value);
        }
        return success;
    }
    /**
     * @private
     * @param {?} item
     * @return {?}
     */
    _toggleItem(item) {
        if (item.selected) {
            this._deselectItem(item);
        }
        else {
            this._selectItem(item);
        }
    }
    /**
     * @private
     * @param {?} item
     * @return {?}
     */
    _selectItem(item) {
        this.updateItems$.next({ type: UpdateActions.Add, item });
    }
    /**
     * @private
     * @param {?} item
     * @return {?}
     */
    _deselectItem(item) {
        this.updateItems$.next({ type: UpdateActions.Remove, item });
    }
    /**
     * @private
     * @param {?} item
     * @param {?} selectedItems
     * @return {?}
     */
    _hasItem(item, selectedItems) {
        return selectedItems.includes(item.value);
    }
    /**
     * @private
     * @param {?} event
     * @return {?}
     */
    _getClosestSelectItem(event) {
        /** @type {?} */
        const target = ((/** @type {?} */ (event.target))).closest('.dts-select-item');
        /** @type {?} */
        let index = -1;
        /** @type {?} */
        let targetItem = null;
        if (target) {
            targetItem = target[SELECT_ITEM_INSTANCE];
            index = this._selectableItems.indexOf(targetItem);
        }
        return [index, targetItem];
    }
    /**
     * @private
     * @return {?}
     */
    _resetRangeStart() {
        this._lastRange = [-1, -1];
        /** @type {?} */
        const lastRangeStart = this._getLastRangeSelection();
        if (lastRangeStart && lastRangeStart.rangeStart) {
            lastRangeStart.toggleRangeStart();
        }
    }
    /**
     * @private
     * @return {?}
     */
    _getLastRangeSelection() {
        if (this._lastStartIndex >= 0) {
            return this._selectableItems[this._lastStartIndex];
        }
        return null;
    }
}
SelectContainerComponent.decorators = [
    { type: Component, args: [{
                selector: 'dts-select-container',
                exportAs: 'dts-select-container',
                host: {
                    class: 'dts-select-container'
                },
                template: `
    <ng-content></ng-content>
    <div
      class="dts-select-box"
      #selectBox
      [ngClass]="selectBoxClasses$ | async"
      [ngStyle]="selectBoxStyles$ | async"
    ></div>
  `,
                styles: [":host{display:block;position:relative}"]
            }] }
];
/** @nocollapse */
SelectContainerComponent.ctorParameters = () => [
    { type: Object, decorators: [{ type: Inject, args: [PLATFORM_ID,] }] },
    { type: ShortcutService },
    { type: KeyboardEventsService },
    { type: ElementRef },
    { type: Renderer2 },
    { type: NgZone }
];
SelectContainerComponent.propDecorators = {
    $selectBox: [{ type: ViewChild, args: ['selectBox', { static: true },] }],
    $selectableItems: [{ type: ContentChildren, args: [SelectItemDirective, { descendants: true },] }],
    selectedItems: [{ type: Input }],
    selectOnDrag: [{ type: Input }],
    disabled: [{ type: Input }],
    disableDrag: [{ type: Input }],
    disableRangeSelection: [{ type: Input }],
    selectMode: [{ type: Input }],
    selectWithShortcut: [{ type: Input }],
    custom: [{ type: Input }, { type: HostBinding, args: ['class.dts-custom',] }],
    selectedItemsChange: [{ type: Output }],
    select: [{ type: Output }],
    itemSelected: [{ type: Output }],
    itemDeselected: [{ type: Output }],
    selectionStarted: [{ type: Output }],
    selectionEnded: [{ type: Output }]
};
if (false) {
    /** @type {?} */
    SelectContainerComponent.prototype.host;
    /** @type {?} */
    SelectContainerComponent.prototype.selectBoxStyles$;
    /** @type {?} */
    SelectContainerComponent.prototype.selectBoxClasses$;
    /**
     * @type {?}
     * @private
     */
    SelectContainerComponent.prototype.$selectBox;
    /**
     * @type {?}
     * @private
     */
    SelectContainerComponent.prototype.$selectableItems;
    /** @type {?} */
    SelectContainerComponent.prototype.selectedItems;
    /** @type {?} */
    SelectContainerComponent.prototype.selectOnDrag;
    /** @type {?} */
    SelectContainerComponent.prototype.disabled;
    /** @type {?} */
    SelectContainerComponent.prototype.disableDrag;
    /** @type {?} */
    SelectContainerComponent.prototype.disableRangeSelection;
    /** @type {?} */
    SelectContainerComponent.prototype.selectMode;
    /** @type {?} */
    SelectContainerComponent.prototype.selectWithShortcut;
    /** @type {?} */
    SelectContainerComponent.prototype.custom;
    /** @type {?} */
    SelectContainerComponent.prototype.selectedItemsChange;
    /** @type {?} */
    SelectContainerComponent.prototype.select;
    /** @type {?} */
    SelectContainerComponent.prototype.itemSelected;
    /** @type {?} */
    SelectContainerComponent.prototype.itemDeselected;
    /** @type {?} */
    SelectContainerComponent.prototype.selectionStarted;
    /** @type {?} */
    SelectContainerComponent.prototype.selectionEnded;
    /**
     * @type {?}
     * @private
     */
    SelectContainerComponent.prototype._tmpItems;
    /**
     * @type {?}
     * @private
     */
    SelectContainerComponent.prototype._selectedItems$;
    /**
     * @type {?}
     * @private
     */
    SelectContainerComponent.prototype._selectableItems;
    /**
     * @type {?}
     * @private
     */
    SelectContainerComponent.prototype.updateItems$;
    /**
     * @type {?}
     * @private
     */
    SelectContainerComponent.prototype.destroy$;
    /**
     * @type {?}
     * @private
     */
    SelectContainerComponent.prototype._lastRange;
    /**
     * @type {?}
     * @private
     */
    SelectContainerComponent.prototype._lastStartIndex;
    /**
     * @type {?}
     * @private
     */
    SelectContainerComponent.prototype._newRangeStart;
    /**
     * @type {?}
     * @private
     */
    SelectContainerComponent.prototype._lastRangeSelection;
    /**
     * @type {?}
     * @private
     */
    SelectContainerComponent.prototype.platformId;
    /**
     * @type {?}
     * @private
     */
    SelectContainerComponent.prototype.shortcuts;
    /**
     * @type {?}
     * @private
     */
    SelectContainerComponent.prototype.keyboardEvents;
    /**
     * @type {?}
     * @private
     */
    SelectContainerComponent.prototype.hostElementRef;
    /**
     * @type {?}
     * @private
     */
    SelectContainerComponent.prototype.renderer;
    /**
     * @type {?}
     * @private
     */
    SelectContainerComponent.prototype.ngZone;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0LWNvbnRhaW5lci5jb21wb25lbnQuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9uZ3gtZHJhZy10by1zZWxlY3QvIiwic291cmNlcyI6WyJsaWIvc2VsZWN0LWNvbnRhaW5lci5jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLE9BQU8sRUFDTCxTQUFTLEVBQ1QsVUFBVSxFQUNWLE1BQU0sRUFDTixZQUFZLEVBQ1osS0FBSyxFQUVMLFNBQVMsRUFDVCxTQUFTLEVBQ1QsTUFBTSxFQUNOLGVBQWUsRUFDZixTQUFTLEVBQ1QsV0FBVyxFQUVYLFdBQVcsRUFDWCxNQUFNLEVBRVAsTUFBTSxlQUFlLENBQUM7QUFFdkIsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFcEQsT0FBTyxFQUFjLE9BQU8sRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLGNBQWMsRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUVuSCxPQUFPLEVBQ0wsU0FBUyxFQUNULFNBQVMsRUFDVCxHQUFHLEVBQ0gsR0FBRyxFQUNILE1BQU0sRUFDTixTQUFTLEVBQ1QsS0FBSyxFQUNMLEtBQUssRUFDTCxjQUFjLEVBQ2Qsb0JBQW9CLEVBQ3BCLFNBQVMsRUFDVCxTQUFTLEVBQ1QsV0FBVyxFQUNYLEtBQUssRUFDTixNQUFNLGdCQUFnQixDQUFDO0FBRXhCLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ3BGLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUVyRCxPQUFPLEVBQUUsZUFBZSxFQUFFLG9CQUFvQixFQUFxQixNQUFNLGFBQWEsQ0FBQztBQUV2RixPQUFPLEVBQ0wsTUFBTSxFQUtOLGFBQWEsRUFHZCxNQUFNLFVBQVUsQ0FBQztBQUVsQixPQUFPLEVBQUUsVUFBVSxFQUFFLGVBQWUsRUFBRSxNQUFNLGFBQWEs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O2tDQUc5QixNQUFNO3FCQUNOLE1BQU07MkJBQ04sTUFBTTs2QkFDTixNQUFNOytCQUNOLE1BQU07NkJBQ04sTUFBTTs7OztJQTNCUCx3Q0FBMEI7O0lBQzFCLG9EQUFnRDs7SUFDaEQscURBQTBEOzs7OztJQUUxRCw4Q0FDK0I7Ozs7O0lBRS9CLG9EQUN5RDs7SUFFekQsaURBQTRCOztJQUM1QixnREFBNkI7O0lBQzdCLDRDQUEwQjs7SUFDMUIsK0NBQTZCOztJQUM3Qix5REFBdUM7O0lBQ3ZDLDhDQUE0Qjs7SUFDNUIsc0RBQW9DOztJQUVwQywwQ0FFZTs7SUFFZix1REFBd0Q7O0lBQ3hELDBDQUEyQzs7SUFDM0MsZ0RBQWlEOztJQUNqRCxrREFBbUQ7O0lBQ25ELG9EQUFzRDs7SUFDdEQsa0RBQTBEOzs7OztJQUUxRCw2Q0FBMkQ7Ozs7O0lBRTNELG1EQUE4RDs7Ozs7SUFDOUQsb0RBQTBEOzs7OztJQUMxRCxnREFBbUQ7Ozs7O0lBQ25ELDRDQUF1Qzs7Ozs7SUFFdkMsOENBQWdEOzs7OztJQUNoRCxtREFBd0Q7Ozs7O0lBQ3hELGtEQUErQjs7Ozs7SUFDL0IsdURBQTJFOzs7OztJQUd6RSw4Q0FBK0M7Ozs7O0lBQy9DLDZDQUFrQzs7Ozs7SUFDbEMsa0RBQTZDOzs7OztJQUM3QyxrREFBa0M7Ozs7O0lBQ2xDLDRDQUEyQjs7Ozs7SUFDM0IsMENBQXNCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ29tcG9uZW50LFxuICBFbGVtZW50UmVmLFxuICBPdXRwdXQsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5wdXQsXG4gIE9uRGVzdHJveSxcbiAgUmVuZGVyZXIyLFxuICBWaWV3Q2hpbGQsXG4gIE5nWm9uZSxcbiAgQ29udGVudENoaWxkcmVuLFxuICBRdWVyeUxpc3QsXG4gIEhvc3RCaW5kaW5nLFxuICBBZnRlclZpZXdJbml0LFxuICBQTEFURk9STV9JRCxcbiAgSW5qZWN0LFxuICBBZnRlckNvbnRlbnRJbml0XG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQgeyBpc1BsYXRmb3JtQnJvd3NlciB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5cbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QsIGNvbWJpbmVMYXRlc3QsIG1lcmdlLCBmcm9tLCBmcm9tRXZlbnQsIEJlaGF2aW9yU3ViamVjdCwgYXN5bmNTY2hlZHVsZXIgfSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtcbiAgc3dpdGNoTWFwLFxuICB0YWtlVW50aWwsXG4gIG1hcCxcbiAgdGFwLFxuICBmaWx0ZXIsXG4gIGF1ZGl0VGltZSxcbiAgbWFwVG8sXG4gIHNoYXJlLFxuICB3aXRoTGF0ZXN0RnJvbSxcbiAgZGlzdGluY3RVbnRpbENoYW5nZWQsXG4gIG9ic2VydmVPbixcbiAgc3RhcnRXaXRoLFxuICBjb25jYXRNYXBUbyxcbiAgZmlyc3Rcbn0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQgeyBTZWxlY3RJdGVtRGlyZWN0aXZlLCBTRUxFQ1RfSVRFTV9JTlNUQU5DRSB9IGZyb20gJy4vc2VsZWN0LWl0ZW0uZGlyZWN0aXZlJztcbmltcG9ydCB7IFNob3J0Y3V0U2VydmljZSB9IGZyb20gJy4vc2hvcnRjdXQuc2VydmljZSc7XG5cbmltcG9ydCB7IGNyZWF0ZVNlbGVjdEJveCwgd2hlblNlbGVjdEJveFZpc2libGUsIGRpc3RpbmN0S2V5RXZlbnRzIH0gZnJvbSAnLi9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge1xuICBBY3Rpb24sXG4gIFNlbGVjdEJveCxcbiAgTW91c2VQb3NpdGlvbixcbiAgU2VsZWN0Q29udGFpbmVySG9zdCxcbiAgVXBkYXRlQWN0aW9uLFxuICBVcGRhdGVBY3Rpb25zLFxuICBQcmVkaWNhdGVGbixcbiAgQm91bmRpbmdCb3hcbn0gZnJvbSAnLi9tb2RlbHMnO1xuXG5pbXBvcnQgeyBBVURJVF9USU1FLCBOT19TRUxFQ1RfQ0xBU1MgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5cbmltcG9ydCB7XG4gIGluQm91bmRpbmdCb3gsXG4gIGN1cnNvcldpdGhpbkVsZW1lbnQsXG4gIGNsZWFyU2VsZWN0aW9uLFxuICBib3hJbnRlcnNlY3RzLFxuICBjYWxjdWxhdGVCb3VuZGluZ0NsaWVudFJlY3QsXG4gIGdldFJlbGF0aXZlTW91c2VQb3NpdGlvbixcbiAgZ2V0TW91c2VQb3NpdGlvbixcbiAgaGFzTWluaW11bVNpemVcbn0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBLZXlib2FyZEV2ZW50c1NlcnZpY2UgfSBmcm9tICcuL2tleWJvYXJkLWV2ZW50cy5zZXJ2aWNlJztcblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnZHRzLXNlbGVjdC1jb250YWluZXInLFxuICBleHBvcnRBczogJ2R0cy1zZWxlY3QtY29udGFpbmVyJyxcbiAgaG9zdDoge1xuICAgIGNsYXNzOiAnZHRzLXNlbGVjdC1jb250YWluZXInXG4gIH0sXG4gIHRlbXBsYXRlOiBgXG4gICAgPG5nLWNvbnRlbnQ+PC9uZy1jb250ZW50PlxuICAgIDxkaXZcbiAgICAgIGNsYXNzPVwiZHRzLXNlbGVjdC1ib3hcIlxuICAgICAgI3NlbGVjdEJveFxuICAgICAgW25nQ2xhc3NdPVwic2VsZWN0Qm94Q2xhc3NlcyQgfCBhc3luY1wiXG4gICAgICBbbmdTdHlsZV09XCJzZWxlY3RCb3hTdHlsZXMkIHwgYXN5bmNcIlxuICAgID48L2Rpdj5cbiAgYCxcbiAgc3R5bGVVcmxzOiBbJy4vc2VsZWN0LWNvbnRhaW5lci5jb21wb25lbnQuc2NzcyddXG59KVxuZXhwb3J0IGNsYXNzIFNlbGVjdENvbnRhaW5lckNvbXBvbmVudCBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQsIE9uRGVzdHJveSwgQWZ0ZXJDb250ZW50SW5pdCB7XG4gIGhvc3Q6IFNlbGVjdENvbnRhaW5lckhvc3Q7XG4gIHNlbGVjdEJveFN0eWxlcyQ6IE9ic2VydmFibGU8U2VsZWN0Qm94PHN0cmluZz4+O1xuICBzZWxlY3RCb3hDbGFzc2VzJDogT2JzZXJ2YWJsZTx7IFtrZXk6IHN0cmluZ106IGJvb2xlYW4gfT47XG5cbiAgQFZpZXdDaGlsZCgnc2VsZWN0Qm94JywgeyBzdGF0aWM6IHRydWUgfSlcbiAgcHJpdmF0ZSAkc2VsZWN0Qm94OiBFbGVtZW50UmVmO1xuXG4gIEBDb250ZW50Q2hpbGRyZW4oU2VsZWN0SXRlbURpcmVjdGl2ZSwgeyBkZXNjZW5kYW50czogdHJ1ZSB9KVxuICBwcml2YXRlICRzZWxlY3RhYmxlSXRlbXM6IFF1ZXJ5TGlzdDxTZWxlY3RJdGVtRGlyZWN0aXZlPjtcblxuICBASW5wdXQoKSBzZWxlY3RlZEl0ZW1zOiBhbnk7XG4gIEBJbnB1dCgpIHNlbGVjdE9uRHJhZyA9IHRydWU7XG4gIEBJbnB1dCgpIGRpc2FibGVkID0gZmFsc2U7XG4gIEBJbnB1dCgpIGRpc2FibGVEcmFnID0gZmFsc2U7XG4gIEBJbnB1dCgpIGRpc2FibGVSYW5nZVNlbGVjdGlvbiA9IGZhbHNlO1xuICBASW5wdXQoKSBzZWxlY3RNb2RlID0gZmFsc2U7XG4gIEBJbnB1dCgpIHNlbGVjdFdpdGhTaG9ydGN1dCA9IGZhbHNlO1xuXG4gIEBJbnB1dCgpXG4gIEBIb3N0QmluZGluZygnY2xhc3MuZHRzLWN1c3RvbScpXG4gIGN1c3RvbSA9IGZhbHNlO1xuXG4gIEBPdXRwdXQoKSBzZWxlY3RlZEl0ZW1zQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG4gIEBPdXRwdXQoKSBzZWxlY3QgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgQE91dHB1dCgpIGl0ZW1TZWxlY3RlZCA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xuICBAT3V0cHV0KCkgaXRlbURlc2VsZWN0ZWQgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgQE91dHB1dCgpIHNlbGVjdGlvblN0YXJ0ZWQgPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG4gIEBPdXRwdXQoKSBzZWxlY3Rpb25FbmRlZCA9IG5ldyBFdmVudEVtaXR0ZXI8QXJyYXk8YW55Pj4oKTtcblxuICBwcml2YXRlIF90bXBJdGVtcyA9IG5ldyBNYXA8U2VsZWN0SXRlbURpcmVjdGl2ZSwgQWN0aW9uPigpO1xuXG4gIHByaXZhdGUgX3NlbGVjdGVkSXRlbXMkID0gbmV3IEJlaGF2aW9yU3ViamVjdDxBcnJheTxhbnk+PihbXSk7XG4gIHByaXZhdGUgX3NlbGVjdGFibGVJdGVtczogQXJyYXk8U2VsZWN0SXRlbURpcmVjdGl2ZT4gPSBbXTtcbiAgcHJpdmF0ZSB1cGRhdGVJdGVtcyQgPSBuZXcgU3ViamVjdDxVcGRhdGVBY3Rpb24+KCk7XG4gIHByaXZhdGUgZGVzdHJveSQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuXG4gIHByaXZhdGUgX2xhc3RSYW5nZTogW251bWJlciwgbnVtYmVyXSA9IFstMSwgLTFdO1xuICBwcml2YXRlIF9sYXN0U3RhcnRJbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBwcml2YXRlIF9uZXdSYW5nZVN0YXJ0ID0gZmFsc2U7XG4gIHByaXZhdGUgX2xhc3RSYW5nZVNlbGVjdGlvbjogTWFwPFNlbGVjdEl0ZW1EaXJlY3RpdmUsIGJvb2xlYW4+ID0gbmV3IE1hcCgpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIEBJbmplY3QoUExBVEZPUk1fSUQpIHByaXZhdGUgcGxhdGZvcm1JZDogT2JqZWN0LFxuICAgIHByaXZhdGUgc2hvcnRjdXRzOiBTaG9ydGN1dFNlcnZpY2UsXG4gICAgcHJpdmF0ZSBrZXlib2FyZEV2ZW50czogS2V5Ym9hcmRFdmVudHNTZXJ2aWNlLFxuICAgIHByaXZhdGUgaG9zdEVsZW1lbnRSZWY6IEVsZW1lbnRSZWYsXG4gICAgcHJpdmF0ZSByZW5kZXJlcjogUmVuZGVyZXIyLFxuICAgIHByaXZhdGUgbmdab25lOiBOZ1pvbmVcbiAgKSB7fVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICBpZiAoaXNQbGF0Zm9ybUJyb3dzZXIodGhpcy5wbGF0Zm9ybUlkKSkge1xuICAgICAgdGhpcy5ob3N0ID0gdGhpcy5ob3N0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuXG4gICAgICB0aGlzLl9pbml0U2VsZWN0ZWRJdGVtc0NoYW5nZSgpO1xuXG4gICAgICB0aGlzLl9jYWxjdWxhdGVCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIHRoaXMuX29ic2VydmVCb3VuZGluZ1JlY3RDaGFuZ2VzKCk7XG4gICAgICB0aGlzLl9vYnNlcnZlU2VsZWN0YWJsZUl0ZW1zKCk7XG5cbiAgICAgIGNvbnN0IG1vdXNldXAkID0gdGhpcy5rZXlib2FyZEV2ZW50cy5tb3VzZXVwJC5waXBlKFxuICAgICAgICBmaWx0ZXIoKCkgPT4gIXRoaXMuZGlzYWJsZWQpLFxuICAgICAgICB0YXAoKCkgPT4gdGhpcy5fb25Nb3VzZVVwKCkpLFxuICAgICAgICBzaGFyZSgpXG4gICAgICApO1xuXG4gICAgICBjb25zdCBtb3VzZW1vdmUkID0gdGhpcy5rZXlib2FyZEV2ZW50cy5tb3VzZW1vdmUkLnBpcGUoXG4gICAgICAgIGZpbHRlcigoKSA9PiAhdGhpcy5kaXNhYmxlZCksXG4gICAgICAgIHNoYXJlKClcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IG1vdXNlZG93biQgPSBmcm9tRXZlbnQ8TW91c2VFdmVudD4odGhpcy5ob3N0LCAnbW91c2Vkb3duJykucGlwZShcbiAgICAgICAgZmlsdGVyKGV2ZW50ID0+IGV2ZW50LmJ1dHRvbiA9PT0gMCksIC8vIG9ubHkgZW1pdCBsZWZ0IG1vdXNlXG4gICAgICAgIGZpbHRlcigoKSA9PiAhdGhpcy5kaXNhYmxlZCksXG4gICAgICAgIHRhcChldmVudCA9PiB0aGlzLl9vbk1vdXNlRG93bihldmVudCkpLFxuICAgICAgICBzaGFyZSgpXG4gICAgICApO1xuXG4gICAgICBjb25zdCBkcmFnZ2luZyQgPSBtb3VzZWRvd24kLnBpcGUoXG4gICAgICAgIGZpbHRlcihldmVudCA9PiAhdGhpcy5zaG9ydGN1dHMuZGlzYWJsZVNlbGVjdGlvbihldmVudCkpLFxuICAgICAgICBmaWx0ZXIoKCkgPT4gIXRoaXMuc2VsZWN0TW9kZSksXG4gICAgICAgIGZpbHRlcigoKSA9PiAhdGhpcy5kaXNhYmxlRHJhZyksXG4gICAgICAgIHN3aXRjaE1hcCgoKSA9PiBtb3VzZW1vdmUkLnBpcGUodGFrZVVudGlsKG1vdXNldXAkKSkpLFxuICAgICAgICBzaGFyZSgpXG4gICAgICApO1xuXG4gICAgICBjb25zdCBjdXJyZW50TW91c2VQb3NpdGlvbiQ6IE9ic2VydmFibGU8TW91c2VQb3NpdGlvbj4gPSBtb3VzZWRvd24kLnBpcGUoXG4gICAgICAgIG1hcCgoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IGdldFJlbGF0aXZlTW91c2VQb3NpdGlvbihldmVudCwgdGhpcy5ob3N0KSlcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHNob3ckID0gZHJhZ2dpbmckLnBpcGUobWFwVG8oMSkpO1xuICAgICAgY29uc3QgaGlkZSQgPSBtb3VzZXVwJC5waXBlKG1hcFRvKDApKTtcbiAgICAgIGNvbnN0IG9wYWNpdHkkID0gbWVyZ2Uoc2hvdyQsIGhpZGUkKS5waXBlKGRpc3RpbmN0VW50aWxDaGFuZ2VkKCkpO1xuXG4gICAgICBjb25zdCBzZWxlY3RCb3gkID0gY29tYmluZUxhdGVzdChbZHJhZ2dpbmckLCBvcGFjaXR5JCwgY3VycmVudE1vdXNlUG9zaXRpb24kXSkucGlwZShcbiAgICAgICAgY3JlYXRlU2VsZWN0Qm94KHRoaXMuaG9zdCksXG4gICAgICAgIHNoYXJlKClcbiAgICAgICk7XG5cbiAgICAgIHRoaXMuc2VsZWN0Qm94Q2xhc3NlcyQgPSBtZXJnZShcbiAgICAgICAgZHJhZ2dpbmckLFxuICAgICAgICBtb3VzZXVwJCxcbiAgICAgICAgdGhpcy5rZXlib2FyZEV2ZW50cy5kaXN0aW5jdEtleWRvd24kLFxuICAgICAgICB0aGlzLmtleWJvYXJkRXZlbnRzLmRpc3RpbmN0S2V5dXAkXG4gICAgICApLnBpcGUoXG4gICAgICAgIGF1ZGl0VGltZShBVURJVF9USU1FKSxcbiAgICAgICAgd2l0aExhdGVzdEZyb20oc2VsZWN0Qm94JCksXG4gICAgICAgIG1hcCgoW2V2ZW50LCBzZWxlY3RCb3hdKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICdkdHMtYWRkaW5nJzogaGFzTWluaW11bVNpemUoc2VsZWN0Qm94LCAwLCAwKSAmJiAhdGhpcy5zaG9ydGN1dHMucmVtb3ZlRnJvbVNlbGVjdGlvbihldmVudCksXG4gICAgICAgICAgICAnZHRzLXJlbW92aW5nJzogdGhpcy5zaG9ydGN1dHMucmVtb3ZlRnJvbVNlbGVjdGlvbihldmVudClcbiAgICAgICAgICB9O1xuICAgICAgICB9KSxcbiAgICAgICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKGEsIGIpID0+IEpTT04uc3RyaW5naWZ5KGEpID09PSBKU09OLnN0cmluZ2lmeShiKSlcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHNlbGVjdE9uTW91c2VVcCQgPSBkcmFnZ2luZyQucGlwZShcbiAgICAgICAgZmlsdGVyKCgpID0+ICF0aGlzLnNlbGVjdE9uRHJhZyksXG4gICAgICAgIGZpbHRlcigoKSA9PiAhdGhpcy5zZWxlY3RNb2RlKSxcbiAgICAgICAgZmlsdGVyKGV2ZW50ID0+IHRoaXMuX2N1cnNvcldpdGhpbkhvc3QoZXZlbnQpKSxcbiAgICAgICAgc3dpdGNoTWFwKF8gPT4gbW91c2V1cCQucGlwZShmaXJzdCgpKSksXG4gICAgICAgIGZpbHRlcihcbiAgICAgICAgICBldmVudCA9PlxuICAgICAgICAgICAgKCF0aGlzLnNob3J0Y3V0cy5kaXNhYmxlU2VsZWN0aW9uKGV2ZW50KSAmJiAhdGhpcy5zaG9ydGN1dHMudG9nZ2xlU2luZ2xlSXRlbShldmVudCkpIHx8XG4gICAgICAgICAgICB0aGlzLnNob3J0Y3V0cy5yZW1vdmVGcm9tU2VsZWN0aW9uKGV2ZW50KVxuICAgICAgICApXG4gICAgICApO1xuXG4gICAgICBjb25zdCBzZWxlY3RPbkRyYWckID0gc2VsZWN0Qm94JC5waXBlKFxuICAgICAgICBhdWRpdFRpbWUoQVVESVRfVElNRSksXG4gICAgICAgIHdpdGhMYXRlc3RGcm9tKG1vdXNlbW92ZSQsIChzZWxlY3RCb3gsIGV2ZW50OiBNb3VzZUV2ZW50KSA9PiAoe1xuICAgICAgICAgIHNlbGVjdEJveCxcbiAgICAgICAgICBldmVudFxuICAgICAgICB9KSksXG4gICAgICAgIGZpbHRlcigoKSA9PiB0aGlzLnNlbGVjdE9uRHJhZyksXG4gICAgICAgIGZpbHRlcigoeyBzZWxlY3RCb3ggfSkgPT4gaGFzTWluaW11bVNpemUoc2VsZWN0Qm94KSksXG4gICAgICAgIG1hcCgoeyBldmVudCB9KSA9PiBldmVudClcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHNlbGVjdE9uS2V5Ym9hcmRFdmVudCQgPSBtZXJnZShcbiAgICAgICAgdGhpcy5rZXlib2FyZEV2ZW50cy5kaXN0aW5jdEtleWRvd24kLFxuICAgICAgICB0aGlzLmtleWJvYXJkRXZlbnRzLmRpc3RpbmN0S2V5dXAkXG4gICAgICApLnBpcGUoXG4gICAgICAgIGF1ZGl0VGltZShBVURJVF9USU1FKSxcbiAgICAgICAgd2hlblNlbGVjdEJveFZpc2libGUoc2VsZWN0Qm94JCksXG4gICAgICAgIHRhcChldmVudCA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuX2lzRXh0ZW5kZWRTZWxlY3Rpb24oZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLl90bXBJdGVtcy5jbGVhcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9mbHVzaEl0ZW1zKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgbWVyZ2Uoc2VsZWN0T25Nb3VzZVVwJCwgc2VsZWN0T25EcmFnJCwgc2VsZWN0T25LZXlib2FyZEV2ZW50JClcbiAgICAgICAgLnBpcGUodGFrZVVudGlsKHRoaXMuZGVzdHJveSQpKVxuICAgICAgICAuc3Vic2NyaWJlKGV2ZW50ID0+IHRoaXMuX3NlbGVjdEl0ZW1zKGV2ZW50KSk7XG5cbiAgICAgIHRoaXMuc2VsZWN0Qm94U3R5bGVzJCA9IHNlbGVjdEJveCQucGlwZShcbiAgICAgICAgbWFwKHNlbGVjdEJveCA9PiAoe1xuICAgICAgICAgIHRvcDogYCR7c2VsZWN0Qm94LnRvcH1weGAsXG4gICAgICAgICAgbGVmdDogYCR7c2VsZWN0Qm94LmxlZnR9cHhgLFxuICAgICAgICAgIHdpZHRoOiBgJHtzZWxlY3RCb3gud2lkdGh9cHhgLFxuICAgICAgICAgIGhlaWdodDogYCR7c2VsZWN0Qm94LmhlaWdodH1weGAsXG4gICAgICAgICAgb3BhY2l0eTogc2VsZWN0Qm94Lm9wYWNpdHlcbiAgICAgICAgfSkpXG4gICAgICApO1xuXG4gICAgICB0aGlzLl9pbml0U2VsZWN0aW9uT3V0cHV0cyhtb3VzZWRvd24kLCBtb3VzZXVwJCk7XG4gICAgfVxuICB9XG5cbiAgbmdBZnRlckNvbnRlbnRJbml0KCkge1xuICAgIHRoaXMuX3NlbGVjdGFibGVJdGVtcyA9IHRoaXMuJHNlbGVjdGFibGVJdGVtcy50b0FycmF5KCk7XG4gIH1cblxuICBzZWxlY3RBbGwoKSB7XG4gICAgdGhpcy4kc2VsZWN0YWJsZUl0ZW1zLmZvckVhY2goaXRlbSA9PiB7XG4gICAgICB0aGlzLl9zZWxlY3RJdGVtKGl0ZW0pO1xuICAgIH0pO1xuICB9XG5cbiAgdG9nZ2xlSXRlbXM8VD4ocHJlZGljYXRlOiBQcmVkaWNhdGVGbjxUPikge1xuICAgIHRoaXMuX2ZpbHRlclNlbGVjdGFibGVJdGVtcyhwcmVkaWNhdGUpLnN1YnNjcmliZSgoaXRlbTogU2VsZWN0SXRlbURpcmVjdGl2ZSkgPT4gdGhpcy5fdG9nZ2xlSXRlbShpdGVtKSk7XG4gIH1cblxuICBzZWxlY3RJdGVtczxUPihwcmVkaWNhdGU6IFByZWRpY2F0ZUZuPFQ+KSB7XG4gICAgdGhpcy5fZmlsdGVyU2VsZWN0YWJsZUl0ZW1zKHByZWRpY2F0ZSkuc3Vic2NyaWJlKChpdGVtOiBTZWxlY3RJdGVtRGlyZWN0aXZlKSA9PiB0aGlzLl9zZWxlY3RJdGVtKGl0ZW0pKTtcbiAgfVxuXG4gIGRlc2VsZWN0SXRlbXM8VD4ocHJlZGljYXRlOiBQcmVkaWNhdGVGbjxUPikge1xuICAgIHRoaXMuX2ZpbHRlclNlbGVjdGFibGVJdGVtcyhwcmVkaWNhdGUpLnN1YnNjcmliZSgoaXRlbTogU2VsZWN0SXRlbURpcmVjdGl2ZSkgPT4gdGhpcy5fZGVzZWxlY3RJdGVtKGl0ZW0pKTtcbiAgfVxuXG4gIGNsZWFyU2VsZWN0aW9uKCkge1xuICAgIHRoaXMuJHNlbGVjdGFibGVJdGVtcy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgdGhpcy5fZGVzZWxlY3RJdGVtKGl0ZW0pO1xuICAgIH0pO1xuICB9XG5cbiAgdXBkYXRlKCkge1xuICAgIHRoaXMuX2NhbGN1bGF0ZUJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHRoaXMuJHNlbGVjdGFibGVJdGVtcy5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5jYWxjdWxhdGVCb3VuZGluZ0NsaWVudFJlY3QoKSk7XG4gIH1cblxuICBzZWxlY3RSYW5nZShzdGFydEluZGV4OiBudW1iZXIsIGVuZEluZGV4OiBudW1iZXIpIHtcbiAgICB0aGlzLiRzZWxlY3RhYmxlSXRlbXMuZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+IHtcbiAgICAgIGlmIChpbmRleCA+PSBzdGFydEluZGV4ICYmIGluZGV4IDw9IGVuZEluZGV4KSB7XG4gICAgICAgIHRoaXMuX3NlbGVjdEl0ZW0oaXRlbSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9kZXNlbGVjdEl0ZW0oaXRlbSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzZWxlY3RBcnJheShpbmRleEFycmF5OiBBcnJheTxudW1iZXI+KSB7XG4gICAgdGhpcy4kc2VsZWN0YWJsZUl0ZW1zLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICBpZiAoaW5kZXhBcnJheS5pbmNsdWRlcyhpbmRleCkpIHtcbiAgICAgICAgdGhpcy5fc2VsZWN0SXRlbShpdGVtKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2Rlc2VsZWN0SXRlbShpdGVtKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuZGVzdHJveSQubmV4dCgpO1xuICAgIHRoaXMuZGVzdHJveSQuY29tcGxldGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgX2ZpbHRlclNlbGVjdGFibGVJdGVtczxUPihwcmVkaWNhdGU6IFByZWRpY2F0ZUZuPFQ+KSB7XG4gICAgLy8gV3JhcCBzZWxlY3QgaXRlbXMgaW4gYW4gb2JzZXJ2YWJsZSBmb3IgYmV0dGVyIGVmZmljaWVuY3kgYXNcbiAgICAvLyBubyBpbnRlcm1lZGlhdGUgYXJyYXlzIGFyZSBjcmVhdGVkIGFuZCB3ZSBvbmx5IG5lZWQgdG8gcHJvY2Vzc1xuICAgIC8vIGV2ZXJ5IGl0ZW0gb25jZS5cbiAgICByZXR1cm4gZnJvbSh0aGlzLl9zZWxlY3RhYmxlSXRlbXMpLnBpcGUoZmlsdGVyKGl0ZW0gPT4gcHJlZGljYXRlKGl0ZW0udmFsdWUpKSk7XG4gIH1cblxuICBwcml2YXRlIF9pbml0U2VsZWN0ZWRJdGVtc0NoYW5nZSgpIHtcbiAgICB0aGlzLl9zZWxlY3RlZEl0ZW1zJC5waXBlKGF1ZGl0VGltZShBVURJVF9USU1FKSwgdGFrZVVudGlsKHRoaXMuZGVzdHJveSQpKS5zdWJzY3JpYmUoe1xuICAgICAgbmV4dDogc2VsZWN0ZWRJdGVtcyA9PiB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtc0NoYW5nZS5lbWl0KHNlbGVjdGVkSXRlbXMpO1xuICAgICAgICB0aGlzLnNlbGVjdC5lbWl0KHNlbGVjdGVkSXRlbXMpO1xuICAgICAgfSxcbiAgICAgIGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJdGVtc0NoYW5nZS5lbWl0KFtdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX29ic2VydmVTZWxlY3RhYmxlSXRlbXMoKSB7XG4gICAgLy8gTGlzdGVuIGZvciB1cGRhdGVzIGFuZCBlaXRoZXIgc2VsZWN0IG9yIGRlc2VsZWN0IGFuIGl0ZW1cbiAgICB0aGlzLnVwZGF0ZUl0ZW1zJFxuICAgICAgLnBpcGUod2l0aExhdGVzdEZyb20odGhpcy5fc2VsZWN0ZWRJdGVtcyQpLCB0YWtlVW50aWwodGhpcy5kZXN0cm95JCkpXG4gICAgICAuc3Vic2NyaWJlKChbdXBkYXRlLCBzZWxlY3RlZEl0ZW1zXTogW1VwZGF0ZUFjdGlvbiwgYW55W11dKSA9PiB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSB1cGRhdGUuaXRlbTtcbiAgICAgICAgc3dpdGNoICh1cGRhdGUudHlwZSkge1xuICAgICAgICAgIGNhc2UgVXBkYXRlQWN0aW9ucy5BZGQ6XG4gICAgICAgICAgICBpZiAodGhpcy5fYWRkSXRlbShpdGVtLCBzZWxlY3RlZEl0ZW1zKSkge1xuICAgICAgICAgICAgICBpdGVtLl9zZWxlY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgVXBkYXRlQWN0aW9ucy5SZW1vdmU6XG4gICAgICAgICAgICBpZiAodGhpcy5fcmVtb3ZlSXRlbShpdGVtLCBzZWxlY3RlZEl0ZW1zKSkge1xuICAgICAgICAgICAgICBpdGVtLl9kZXNlbGVjdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBjb250YWluZXIgYXMgd2VsbCBhcyBhbGwgc2VsZWN0YWJsZSBpdGVtcyBpZiB0aGUgbGlzdCBoYXMgY2hhbmdlZFxuICAgIHRoaXMuJHNlbGVjdGFibGVJdGVtcy5jaGFuZ2VzXG4gICAgICAucGlwZSh3aXRoTGF0ZXN0RnJvbSh0aGlzLl9zZWxlY3RlZEl0ZW1zJCksIG9ic2VydmVPbihhc3luY1NjaGVkdWxlciksIHRha2VVbnRpbCh0aGlzLmRlc3Ryb3kkKSlcbiAgICAgIC5zdWJzY3JpYmUoKFtpdGVtcywgc2VsZWN0ZWRJdGVtc106IFtRdWVyeUxpc3Q8U2VsZWN0SXRlbURpcmVjdGl2ZT4sIGFueVtdXSkgPT4ge1xuICAgICAgICBjb25zdCBuZXdMaXN0ID0gaXRlbXMudG9BcnJheSgpO1xuICAgICAgICB0aGlzLl9zZWxlY3RhYmxlSXRlbXMgPSBuZXdMaXN0O1xuICAgICAgICBjb25zdCByZW1vdmVkSXRlbXMgPSBzZWxlY3RlZEl0ZW1zLmZpbHRlcihpdGVtID0+ICFuZXdMaXN0LmluY2x1ZGVzKGl0ZW0udmFsdWUpKTtcblxuICAgICAgICBpZiAocmVtb3ZlZEl0ZW1zLmxlbmd0aCkge1xuICAgICAgICAgIHJlbW92ZWRJdGVtcy5mb3JFYWNoKGl0ZW0gPT4gdGhpcy5fcmVtb3ZlSXRlbShpdGVtLCBzZWxlY3RlZEl0ZW1zKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9vYnNlcnZlQm91bmRpbmdSZWN0Q2hhbmdlcygpIHtcbiAgICB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICBjb25zdCByZXNpemUkID0gZnJvbUV2ZW50KHdpbmRvdywgJ3Jlc2l6ZScpO1xuICAgICAgY29uc3Qgd2luZG93U2Nyb2xsJCA9IGZyb21FdmVudCh3aW5kb3csICdzY3JvbGwnKTtcbiAgICAgIGNvbnN0IGNvbnRhaW5lclNjcm9sbCQgPSBmcm9tRXZlbnQodGhpcy5ob3N0LCAnc2Nyb2xsJyk7XG5cbiAgICAgIG1lcmdlKHJlc2l6ZSQsIHdpbmRvd1Njcm9sbCQsIGNvbnRhaW5lclNjcm9sbCQpXG4gICAgICAgIC5waXBlKHN0YXJ0V2l0aCgnSU5JVElBTF9VUERBVEUnKSwgYXVkaXRUaW1lKEFVRElUX1RJTUUpLCB0YWtlVW50aWwodGhpcy5kZXN0cm95JCkpXG4gICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfaW5pdFNlbGVjdGlvbk91dHB1dHMobW91c2Vkb3duJDogT2JzZXJ2YWJsZTxNb3VzZUV2ZW50PiwgbW91c2V1cCQ6IE9ic2VydmFibGU8TW91c2VFdmVudD4pIHtcbiAgICBtb3VzZWRvd24kXG4gICAgICAucGlwZShcbiAgICAgICAgZmlsdGVyKGV2ZW50ID0+IHRoaXMuX2N1cnNvcldpdGhpbkhvc3QoZXZlbnQpKSxcbiAgICAgICAgdGFwKCgpID0+IHRoaXMuc2VsZWN0aW9uU3RhcnRlZC5lbWl0KCkpLFxuICAgICAgICBjb25jYXRNYXBUbyhtb3VzZXVwJC5waXBlKGZpcnN0KCkpKSxcbiAgICAgICAgd2l0aExhdGVzdEZyb20odGhpcy5fc2VsZWN0ZWRJdGVtcyQpLFxuICAgICAgICBtYXAoKFssIGl0ZW1zXSkgPT4gaXRlbXMpLFxuICAgICAgICB0YWtlVW50aWwodGhpcy5kZXN0cm95JClcbiAgICAgIClcbiAgICAgIC5zdWJzY3JpYmUoaXRlbXMgPT4ge1xuICAgICAgICB0aGlzLnNlbGVjdGlvbkVuZGVkLmVtaXQoaXRlbXMpO1xuICAgICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9jYWxjdWxhdGVCb3VuZGluZ0NsaWVudFJlY3QoKSB7XG4gICAgdGhpcy5ob3N0LmJvdW5kaW5nQ2xpZW50UmVjdCA9IGNhbGN1bGF0ZUJvdW5kaW5nQ2xpZW50UmVjdCh0aGlzLmhvc3QpO1xuICB9XG5cbiAgcHJpdmF0ZSBfY3Vyc29yV2l0aGluSG9zdChldmVudDogTW91c2VFdmVudCkge1xuICAgIHJldHVybiBjdXJzb3JXaXRoaW5FbGVtZW50KGV2ZW50LCB0aGlzLmhvc3QpO1xuICB9XG5cbiAgcHJpdmF0ZSBfb25Nb3VzZVVwKCkge1xuICAgIHRoaXMuX2ZsdXNoSXRlbXMoKTtcbiAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZUNsYXNzKGRvY3VtZW50LmJvZHksIE5PX1NFTEVDVF9DTEFTUyk7XG4gIH1cblxuICBwcml2YXRlIF9vbk1vdXNlRG93bihldmVudDogTW91c2VFdmVudCkge1xuICAgIGlmICh0aGlzLnNob3J0Y3V0cy5kaXNhYmxlU2VsZWN0aW9uKGV2ZW50KSB8fCB0aGlzLmRpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY2xlYXJTZWxlY3Rpb24od2luZG93KTtcblxuICAgIGlmICghdGhpcy5kaXNhYmxlRHJhZykge1xuICAgICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyhkb2N1bWVudC5ib2R5LCBOT19TRUxFQ1RfQ0xBU1MpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnNob3J0Y3V0cy5yZW1vdmVGcm9tU2VsZWN0aW9uKGV2ZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG1vdXNlUG9pbnQgPSBnZXRNb3VzZVBvc2l0aW9uKGV2ZW50KTtcbiAgICBjb25zdCBbY3VycmVudEluZGV4LCBjbGlja2VkSXRlbV0gPSB0aGlzLl9nZXRDbG9zZXN0U2VsZWN0SXRlbShldmVudCk7XG5cbiAgICBsZXQgW3N0YXJ0SW5kZXgsIGVuZEluZGV4XSA9IHRoaXMuX2xhc3RSYW5nZTtcblxuICAgIGNvbnN0IGlzTW92ZVJhbmdlU3RhcnQgPSB0aGlzLnNob3J0Y3V0cy5tb3ZlUmFuZ2VTdGFydChldmVudCk7XG5cbiAgICBjb25zdCBzaG91bGRSZXNldFJhbmdlU2VsZWN0aW9uID1cbiAgICAgICF0aGlzLnNob3J0Y3V0cy5leHRlbmRlZFNlbGVjdGlvblNob3J0Y3V0KGV2ZW50KSB8fCBpc01vdmVSYW5nZVN0YXJ0IHx8IHRoaXMuZGlzYWJsZVJhbmdlU2VsZWN0aW9uO1xuXG4gICAgaWYgKHNob3VsZFJlc2V0UmFuZ2VTZWxlY3Rpb24pIHtcbiAgICAgIHRoaXMuX3Jlc2V0UmFuZ2VTdGFydCgpO1xuICAgIH1cblxuICAgIC8vIG1vdmUgcmFuZ2Ugc3RhcnRcbiAgICBpZiAoc2hvdWxkUmVzZXRSYW5nZVNlbGVjdGlvbiAmJiAhdGhpcy5kaXNhYmxlUmFuZ2VTZWxlY3Rpb24pIHtcbiAgICAgIGlmIChjdXJyZW50SW5kZXggPiAtMSkge1xuICAgICAgICB0aGlzLl9uZXdSYW5nZVN0YXJ0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fbGFzdFN0YXJ0SW5kZXggPSBjdXJyZW50SW5kZXg7XG4gICAgICAgIGNsaWNrZWRJdGVtLnRvZ2dsZVJhbmdlU3RhcnQoKTtcblxuICAgICAgICB0aGlzLl9sYXN0UmFuZ2VTZWxlY3Rpb24uY2xlYXIoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2xhc3RTdGFydEluZGV4ID0gLTE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRJbmRleCA+IC0xKSB7XG4gICAgICBzdGFydEluZGV4ID0gTWF0aC5taW4odGhpcy5fbGFzdFN0YXJ0SW5kZXgsIGN1cnJlbnRJbmRleCk7XG4gICAgICBlbmRJbmRleCA9IE1hdGgubWF4KHRoaXMuX2xhc3RTdGFydEluZGV4LCBjdXJyZW50SW5kZXgpO1xuICAgICAgdGhpcy5fbGFzdFJhbmdlID0gW3N0YXJ0SW5kZXgsIGVuZEluZGV4XTtcbiAgICB9XG5cbiAgICBpZiAoaXNNb3ZlUmFuZ2VTdGFydCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuJHNlbGVjdGFibGVJdGVtcy5mb3JFYWNoKChpdGVtLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgaXRlbVJlY3QgPSBpdGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgY29uc3Qgd2l0aGluQm91bmRpbmdCb3ggPSBpbkJvdW5kaW5nQm94KG1vdXNlUG9pbnQsIGl0ZW1SZWN0KTtcblxuICAgICAgaWYgKHRoaXMuc2hvcnRjdXRzLmV4dGVuZGVkU2VsZWN0aW9uU2hvcnRjdXQoZXZlbnQpICYmIHRoaXMuZGlzYWJsZVJhbmdlU2VsZWN0aW9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgd2l0aGluUmFuZ2UgPVxuICAgICAgICB0aGlzLnNob3J0Y3V0cy5leHRlbmRlZFNlbGVjdGlvblNob3J0Y3V0KGV2ZW50KSAmJlxuICAgICAgICBzdGFydEluZGV4ID4gLTEgJiZcbiAgICAgICAgZW5kSW5kZXggPiAtMSAmJlxuICAgICAgICBpbmRleCA+PSBzdGFydEluZGV4ICYmXG4gICAgICAgIGluZGV4IDw9IGVuZEluZGV4ICYmXG4gICAgICAgIHN0YXJ0SW5kZXggIT09IGVuZEluZGV4O1xuXG4gICAgICBjb25zdCBzaG91bGRBZGQgPVxuICAgICAgICAod2l0aGluQm91bmRpbmdCb3ggJiZcbiAgICAgICAgICAhdGhpcy5zaG9ydGN1dHMudG9nZ2xlU2luZ2xlSXRlbShldmVudCkgJiZcbiAgICAgICAgICAhdGhpcy5zZWxlY3RNb2RlICYmXG4gICAgICAgICAgIXRoaXMuc2VsZWN0V2l0aFNob3J0Y3V0KSB8fFxuICAgICAgICAodGhpcy5zaG9ydGN1dHMuZXh0ZW5kZWRTZWxlY3Rpb25TaG9ydGN1dChldmVudCkgJiYgaXRlbS5zZWxlY3RlZCAmJiAhdGhpcy5fbGFzdFJhbmdlU2VsZWN0aW9uLmdldChpdGVtKSkgfHxcbiAgICAgICAgd2l0aGluUmFuZ2UgfHxcbiAgICAgICAgKHdpdGhpbkJvdW5kaW5nQm94ICYmIHRoaXMuc2hvcnRjdXRzLnRvZ2dsZVNpbmdsZUl0ZW0oZXZlbnQpICYmICFpdGVtLnNlbGVjdGVkKSB8fFxuICAgICAgICAoIXdpdGhpbkJvdW5kaW5nQm94ICYmIHRoaXMuc2hvcnRjdXRzLnRvZ2dsZVNpbmdsZUl0ZW0oZXZlbnQpICYmIGl0ZW0uc2VsZWN0ZWQpIHx8XG4gICAgICAgICh3aXRoaW5Cb3VuZGluZ0JveCAmJiAhaXRlbS5zZWxlY3RlZCAmJiB0aGlzLnNlbGVjdE1vZGUpIHx8XG4gICAgICAgICghd2l0aGluQm91bmRpbmdCb3ggJiYgaXRlbS5zZWxlY3RlZCAmJiB0aGlzLnNlbGVjdE1vZGUpO1xuXG4gICAgICBjb25zdCBzaG91bGRSZW1vdmUgPVxuICAgICAgICAoIXdpdGhpbkJvdW5kaW5nQm94ICYmXG4gICAgICAgICAgIXRoaXMuc2hvcnRjdXRzLnRvZ2dsZVNpbmdsZUl0ZW0oZXZlbnQpICYmXG4gICAgICAgICAgIXRoaXMuc2VsZWN0TW9kZSAmJlxuICAgICAgICAgICF0aGlzLnNob3J0Y3V0cy5leHRlbmRlZFNlbGVjdGlvblNob3J0Y3V0KGV2ZW50KSAmJlxuICAgICAgICAgICF0aGlzLnNlbGVjdFdpdGhTaG9ydGN1dCkgfHxcbiAgICAgICAgKHRoaXMuc2hvcnRjdXRzLmV4dGVuZGVkU2VsZWN0aW9uU2hvcnRjdXQoZXZlbnQpICYmIGN1cnJlbnRJbmRleCA+IC0xKSB8fFxuICAgICAgICAoIXdpdGhpbkJvdW5kaW5nQm94ICYmIHRoaXMuc2hvcnRjdXRzLnRvZ2dsZVNpbmdsZUl0ZW0oZXZlbnQpICYmICFpdGVtLnNlbGVjdGVkKSB8fFxuICAgICAgICAod2l0aGluQm91bmRpbmdCb3ggJiYgdGhpcy5zaG9ydGN1dHMudG9nZ2xlU2luZ2xlSXRlbShldmVudCkgJiYgaXRlbS5zZWxlY3RlZCkgfHxcbiAgICAgICAgKCF3aXRoaW5Cb3VuZGluZ0JveCAmJiAhaXRlbS5zZWxlY3RlZCAmJiB0aGlzLnNlbGVjdE1vZGUpIHx8XG4gICAgICAgICh3aXRoaW5Cb3VuZGluZ0JveCAmJiBpdGVtLnNlbGVjdGVkICYmIHRoaXMuc2VsZWN0TW9kZSk7XG5cbiAgICAgIGlmIChzaG91bGRBZGQpIHtcbiAgICAgICAgdGhpcy5fc2VsZWN0SXRlbShpdGVtKTtcbiAgICAgIH0gZWxzZSBpZiAoc2hvdWxkUmVtb3ZlKSB7XG4gICAgICAgIHRoaXMuX2Rlc2VsZWN0SXRlbShpdGVtKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHdpdGhpblJhbmdlICYmICF0aGlzLl9sYXN0UmFuZ2VTZWxlY3Rpb24uZ2V0KGl0ZW0pKSB7XG4gICAgICAgIHRoaXMuX2xhc3RSYW5nZVNlbGVjdGlvbi5zZXQoaXRlbSwgdHJ1ZSk7XG4gICAgICB9IGVsc2UgaWYgKCF3aXRoaW5SYW5nZSAmJiAhdGhpcy5fbmV3UmFuZ2VTdGFydCAmJiAhaXRlbS5zZWxlY3RlZCkge1xuICAgICAgICB0aGlzLl9sYXN0UmFuZ2VTZWxlY3Rpb24uZGVsZXRlKGl0ZW0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gaWYgd2UgZG9uJ3QgdG9nZ2xlIGEgc2luZ2xlIGl0ZW0sIHdlIHNldCBgbmV3UmFuZ2VTdGFydGAgdG8gYGZhbHNlYFxuICAgIC8vIG1lYW5pbmcgdGhhdCB3ZSBhcmUgYnVpbGRpbmcgdXAgYSByYW5nZVxuICAgIGlmICghdGhpcy5zaG9ydGN1dHMudG9nZ2xlU2luZ2xlSXRlbShldmVudCkpIHtcbiAgICAgIHRoaXMuX25ld1JhbmdlU3RhcnQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9zZWxlY3RJdGVtcyhldmVudDogRXZlbnQpIHtcbiAgICBjb25zdCBzZWxlY3Rpb25Cb3ggPSBjYWxjdWxhdGVCb3VuZGluZ0NsaWVudFJlY3QodGhpcy4kc2VsZWN0Qm94Lm5hdGl2ZUVsZW1lbnQpO1xuXG4gICAgdGhpcy4kc2VsZWN0YWJsZUl0ZW1zLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICBpZiAodGhpcy5faXNFeHRlbmRlZFNlbGVjdGlvbihldmVudCkpIHtcbiAgICAgICAgdGhpcy5fZXh0ZW5kZWRTZWxlY3Rpb25Nb2RlKHNlbGVjdGlvbkJveCwgaXRlbSwgZXZlbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbm9ybWFsU2VsZWN0aW9uTW9kZShzZWxlY3Rpb25Cb3gsIGl0ZW0sIGV2ZW50KTtcblxuICAgICAgICBpZiAodGhpcy5fbGFzdFN0YXJ0SW5kZXggPCAwICYmIGl0ZW0uc2VsZWN0ZWQpIHtcbiAgICAgICAgICBpdGVtLnRvZ2dsZVJhbmdlU3RhcnQoKTtcbiAgICAgICAgICB0aGlzLl9sYXN0U3RhcnRJbmRleCA9IGluZGV4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9pc0V4dGVuZGVkU2VsZWN0aW9uKGV2ZW50OiBFdmVudCkge1xuICAgIHJldHVybiB0aGlzLnNob3J0Y3V0cy5leHRlbmRlZFNlbGVjdGlvblNob3J0Y3V0KGV2ZW50KSAmJiB0aGlzLnNlbGVjdE9uRHJhZztcbiAgfVxuXG4gIHByaXZhdGUgX25vcm1hbFNlbGVjdGlvbk1vZGUoc2VsZWN0Qm94OiBCb3VuZGluZ0JveCwgaXRlbTogU2VsZWN0SXRlbURpcmVjdGl2ZSwgZXZlbnQ6IEV2ZW50KSB7XG4gICAgY29uc3QgaW5TZWxlY3Rpb24gPSBib3hJbnRlcnNlY3RzKHNlbGVjdEJveCwgaXRlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSk7XG5cbiAgICBjb25zdCBzaG91bGRBZGQgPSBpblNlbGVjdGlvbiAmJiAhaXRlbS5zZWxlY3RlZCAmJiAhdGhpcy5zaG9ydGN1dHMucmVtb3ZlRnJvbVNlbGVjdGlvbihldmVudCk7XG5cbiAgICBjb25zdCBzaG91bGRSZW1vdmUgPVxuICAgICAgKCFpblNlbGVjdGlvbiAmJiBpdGVtLnNlbGVjdGVkICYmICF0aGlzLnNob3J0Y3V0cy5hZGRUb1NlbGVjdGlvbihldmVudCkpIHx8XG4gICAgICAoaW5TZWxlY3Rpb24gJiYgaXRlbS5zZWxlY3RlZCAmJiB0aGlzLnNob3J0Y3V0cy5yZW1vdmVGcm9tU2VsZWN0aW9uKGV2ZW50KSk7XG5cbiAgICBpZiAoc2hvdWxkQWRkKSB7XG4gICAgICB0aGlzLl9zZWxlY3RJdGVtKGl0ZW0pO1xuICAgIH0gZWxzZSBpZiAoc2hvdWxkUmVtb3ZlKSB7XG4gICAgICB0aGlzLl9kZXNlbGVjdEl0ZW0oaXRlbSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfZXh0ZW5kZWRTZWxlY3Rpb25Nb2RlKHNlbGVjdEJveCwgaXRlbTogU2VsZWN0SXRlbURpcmVjdGl2ZSwgZXZlbnQ6IEV2ZW50KSB7XG4gICAgY29uc3QgaW5TZWxlY3Rpb24gPSBib3hJbnRlcnNlY3RzKHNlbGVjdEJveCwgaXRlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSk7XG5cbiAgICBjb25zdCBzaG91ZGxBZGQgPVxuICAgICAgKGluU2VsZWN0aW9uICYmICFpdGVtLnNlbGVjdGVkICYmICF0aGlzLnNob3J0Y3V0cy5yZW1vdmVGcm9tU2VsZWN0aW9uKGV2ZW50KSAmJiAhdGhpcy5fdG1wSXRlbXMuaGFzKGl0ZW0pKSB8fFxuICAgICAgKGluU2VsZWN0aW9uICYmIGl0ZW0uc2VsZWN0ZWQgJiYgdGhpcy5zaG9ydGN1dHMucmVtb3ZlRnJvbVNlbGVjdGlvbihldmVudCkgJiYgIXRoaXMuX3RtcEl0ZW1zLmhhcyhpdGVtKSk7XG5cbiAgICBjb25zdCBzaG91bGRSZW1vdmUgPVxuICAgICAgKCFpblNlbGVjdGlvbiAmJiBpdGVtLnNlbGVjdGVkICYmIHRoaXMuc2hvcnRjdXRzLmFkZFRvU2VsZWN0aW9uKGV2ZW50KSAmJiB0aGlzLl90bXBJdGVtcy5oYXMoaXRlbSkpIHx8XG4gICAgICAoIWluU2VsZWN0aW9uICYmICFpdGVtLnNlbGVjdGVkICYmIHRoaXMuc2hvcnRjdXRzLnJlbW92ZUZyb21TZWxlY3Rpb24oZXZlbnQpICYmIHRoaXMuX3RtcEl0ZW1zLmhhcyhpdGVtKSk7XG5cbiAgICBpZiAoc2hvdWRsQWRkKSB7XG4gICAgICBpdGVtLnNlbGVjdGVkID8gaXRlbS5fZGVzZWxlY3QoKSA6IGl0ZW0uX3NlbGVjdCgpO1xuXG4gICAgICBjb25zdCBhY3Rpb24gPSB0aGlzLnNob3J0Y3V0cy5yZW1vdmVGcm9tU2VsZWN0aW9uKGV2ZW50KVxuICAgICAgICA/IEFjdGlvbi5EZWxldGVcbiAgICAgICAgOiB0aGlzLnNob3J0Y3V0cy5hZGRUb1NlbGVjdGlvbihldmVudClcbiAgICAgICAgPyBBY3Rpb24uQWRkXG4gICAgICAgIDogQWN0aW9uLk5vbmU7XG5cbiAgICAgIHRoaXMuX3RtcEl0ZW1zLnNldChpdGVtLCBhY3Rpb24pO1xuICAgIH0gZWxzZSBpZiAoc2hvdWxkUmVtb3ZlKSB7XG4gICAgICB0aGlzLnNob3J0Y3V0cy5yZW1vdmVGcm9tU2VsZWN0aW9uKGV2ZW50KSA/IGl0ZW0uX3NlbGVjdCgpIDogaXRlbS5fZGVzZWxlY3QoKTtcbiAgICAgIHRoaXMuX3RtcEl0ZW1zLmRlbGV0ZShpdGVtKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9mbHVzaEl0ZW1zKCkge1xuICAgIHRoaXMuX3RtcEl0ZW1zLmZvckVhY2goKGFjdGlvbiwgaXRlbSkgPT4ge1xuICAgICAgaWYgKGFjdGlvbiA9PT0gQWN0aW9uLkFkZCkge1xuICAgICAgICB0aGlzLl9zZWxlY3RJdGVtKGl0ZW0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoYWN0aW9uID09PSBBY3Rpb24uRGVsZXRlKSB7XG4gICAgICAgIHRoaXMuX2Rlc2VsZWN0SXRlbShpdGVtKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuX3RtcEl0ZW1zLmNsZWFyKCk7XG4gIH1cblxuICBwcml2YXRlIF9hZGRJdGVtKGl0ZW06IFNlbGVjdEl0ZW1EaXJlY3RpdmUsIHNlbGVjdGVkSXRlbXM6IEFycmF5PGFueT4pIHtcbiAgICBsZXQgc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgaWYgKCF0aGlzLl9oYXNJdGVtKGl0ZW0sIHNlbGVjdGVkSXRlbXMpKSB7XG4gICAgICBzdWNjZXNzID0gdHJ1ZTtcbiAgICAgIHNlbGVjdGVkSXRlbXMucHVzaChpdGVtLnZhbHVlKTtcbiAgICAgIHRoaXMuX3NlbGVjdGVkSXRlbXMkLm5leHQoc2VsZWN0ZWRJdGVtcyk7XG4gICAgICB0aGlzLml0ZW1TZWxlY3RlZC5lbWl0KGl0ZW0udmFsdWUpO1xuICAgIH1cblxuICAgIHJldHVybiBzdWNjZXNzO1xuICB9XG5cbiAgcHJpdmF0ZSBfcmVtb3ZlSXRlbShpdGVtOiBTZWxlY3RJdGVtRGlyZWN0aXZlLCBzZWxlY3RlZEl0ZW1zOiBBcnJheTxhbnk+KSB7XG4gICAgbGV0IHN1Y2Nlc3MgPSBmYWxzZTtcbiAgICBjb25zdCB2YWx1ZSA9IGl0ZW0gaW5zdGFuY2VvZiBTZWxlY3RJdGVtRGlyZWN0aXZlID8gaXRlbS52YWx1ZSA6IGl0ZW07XG4gICAgY29uc3QgaW5kZXggPSBzZWxlY3RlZEl0ZW1zLmluZGV4T2YodmFsdWUpO1xuXG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHN1Y2Nlc3MgPSB0cnVlO1xuICAgICAgc2VsZWN0ZWRJdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgdGhpcy5fc2VsZWN0ZWRJdGVtcyQubmV4dChzZWxlY3RlZEl0ZW1zKTtcbiAgICAgIHRoaXMuaXRlbURlc2VsZWN0ZWQuZW1pdChpdGVtLnZhbHVlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3VjY2VzcztcbiAgfVxuXG4gIHByaXZhdGUgX3RvZ2dsZUl0ZW0oaXRlbTogU2VsZWN0SXRlbURpcmVjdGl2ZSkge1xuICAgIGlmIChpdGVtLnNlbGVjdGVkKSB7XG4gICAgICB0aGlzLl9kZXNlbGVjdEl0ZW0oaXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3NlbGVjdEl0ZW0oaXRlbSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfc2VsZWN0SXRlbShpdGVtOiBTZWxlY3RJdGVtRGlyZWN0aXZlKSB7XG4gICAgdGhpcy51cGRhdGVJdGVtcyQubmV4dCh7IHR5cGU6IFVwZGF0ZUFjdGlvbnMuQWRkLCBpdGVtIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfZGVzZWxlY3RJdGVtKGl0ZW06IFNlbGVjdEl0ZW1EaXJlY3RpdmUpIHtcbiAgICB0aGlzLnVwZGF0ZUl0ZW1zJC5uZXh0KHsgdHlwZTogVXBkYXRlQWN0aW9ucy5SZW1vdmUsIGl0ZW0gfSk7XG4gIH1cblxuICBwcml2YXRlIF9oYXNJdGVtKGl0ZW06IFNlbGVjdEl0ZW1EaXJlY3RpdmUsIHNlbGVjdGVkSXRlbXM6IEFycmF5PGFueT4pIHtcbiAgICByZXR1cm4gc2VsZWN0ZWRJdGVtcy5pbmNsdWRlcyhpdGVtLnZhbHVlKTtcbiAgfVxuXG4gIHByaXZhdGUgX2dldENsb3Nlc3RTZWxlY3RJdGVtKGV2ZW50OiBFdmVudCk6IFtudW1iZXIsIFNlbGVjdEl0ZW1EaXJlY3RpdmVdIHtcbiAgICBjb25zdCB0YXJnZXQgPSAoZXZlbnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50KS5jbG9zZXN0KCcuZHRzLXNlbGVjdC1pdGVtJyk7XG4gICAgbGV0IGluZGV4ID0gLTE7XG4gICAgbGV0IHRhcmdldEl0ZW0gPSBudWxsO1xuXG4gICAgaWYgKHRhcmdldCkge1xuICAgICAgdGFyZ2V0SXRlbSA9IHRhcmdldFtTRUxFQ1RfSVRFTV9JTlNUQU5DRV07XG4gICAgICBpbmRleCA9IHRoaXMuX3NlbGVjdGFibGVJdGVtcy5pbmRleE9mKHRhcmdldEl0ZW0pO1xuICAgIH1cblxuICAgIHJldHVybiBbaW5kZXgsIHRhcmdldEl0ZW1dO1xuICB9XG5cbiAgcHJpdmF0ZSBfcmVzZXRSYW5nZVN0YXJ0KCkge1xuICAgIHRoaXMuX2xhc3RSYW5nZSA9IFstMSwgLTFdO1xuICAgIGNvbnN0IGxhc3RSYW5nZVN0YXJ0ID0gdGhpcy5fZ2V0TGFzdFJhbmdlU2VsZWN0aW9uKCk7XG5cbiAgICBpZiAobGFzdFJhbmdlU3RhcnQgJiYgbGFzdFJhbmdlU3RhcnQucmFuZ2VTdGFydCkge1xuICAgICAgbGFzdFJhbmdlU3RhcnQudG9nZ2xlUmFuZ2VTdGFydCgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2dldExhc3RSYW5nZVNlbGVjdGlvbigpOiBTZWxlY3RJdGVtRGlyZWN0aXZlIHwgbnVsbCB7XG4gICAgaWYgKHRoaXMuX2xhc3RTdGFydEluZGV4ID49IDApIHtcbiAgICAgIHJldHVybiB0aGlzLl9zZWxlY3RhYmxlSXRlbXNbdGhpcy5fbGFzdFN0YXJ0SW5kZXhdO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iXX0=