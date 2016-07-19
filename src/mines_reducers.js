import Immutable from 'immutable';
import {combineReducers} from 'redux';

function newMineField(rows, columns, mines) {
    // make a set of all positions
    var positions = [],
        field = new Array(rows),
        i,
        j,
        row,
        x,
        y;

    if (mines > i * j) {
        throw new Error('too many mines');
    }

    for (i = 0; i < rows; i++) {
        row = field[i] = new Array(columns);
        for (j = 0; j < columns; j++) {
            positions.push([i, j]);
            row[j] = 0;
        }
    }

    for (i = 0; i < mines; i++) {
        j = Math.floor(Math.random() * positions.length);
        [[y, x]] = positions.splice(j, 1);
        field[y][x] = 1;
    }

    return field;
}

const dfltGame = new Immutable.Map({
    rows: 10,
    columns: 10,
    mines: 10
});

function newGameReducer(state = dfltGame, action) {
    var newState = state;
    switch (action.type) {
    case 'SET_NEWGAME':
        if (typeof action.rows !== 'undefined') {
            newState = newState.set('rows',
                Number(action.rows) || action.rows);
        }
        if (typeof action.columns !== 'undefined') {
            newState = newState.set('columns',
                Number(action.columns) || action.columns);
        }
        if (typeof action.mines !== 'undefined') {
            newState = newState.set('mines',
                Number(action.mines) || action.mines);
        }
        return newState;
    case 'VALIDATE_NEWGAME':
        var rows = state.get('rows'),
            columns = state.get('columns'),
            mines = state.get('mines');
        if (rows < 2 || rows > 50) {
            newState = newState.set('rows', dfltGame.get('rows'));
        }
        if (columns < 2 || columns > 50) {
            newState = newState.set('columns', dfltGame.get('columns'));
        }
        var maxMines = Math.floor(newState.get('rows') *
            newState.get('columns') - 1);
        if (mines > maxMines || mines < 1) {
            newState = newState.set('mines', dfltGame.get('mines'));
        }
        return newState;
    default:
        return state;
    }
}

function visibleControlsReducer(state = false, action) {
    switch (action.type) {
    case 'TOGGLE_CONTROLS':
        return !state;
    case 'HIDE_CONTROLS':
        return false;
    default:
        return state;
    }
}

function statusReducer(state = 'idle', action) {
    switch (action.type) {
    case 'SHOW':
        return (state === 'idle') ? 'running' : state;
    default:
        return state;
    }
}

function timeReducer(state = 0, action) {
    switch (action.type) {
    case 'TICK':
        return state + 1;
    default:
        return state;
    }
}

function fieldReducer(state = Immutable.List(), action) {
    var {type, row, column} = action,
        rowList, spot, newSpot;
    switch (type) {
    case 'MARK':
        rowList = state.get(row);
        spot = rowList.get(column);
        if (spot.get('seen') === 'unseen') {
            newSpot = spot.set('seen', 'mark');
        }
        else if (spot.get('seen') === 'mark') {
            newSpot = spot.set('seen', 'unseen');
        }
        else { return state; }

        return state.set(row, rowList.set(column, newSpot));
    case 'SHOW':
        rowList = state.get(row);
        spot = rowList.get(column);
        if (spot.get('seen') === 'unseen') {
            if (spot.get('mine')) {
                // BOOM! Reveal all mines
                return state.map((rowi, i) => {
                    return rowi.map((spotj, j) => {
                        if (spotj.get('mine')) {
                            if (i === row && j === column) {
                                return spotj.set('seen', 'boom');
                            }
                            return spotj.set('seen', 'mine');
                        }
                        if (spotj.get('seen') === 'mark') {
                            return spotj.set('seen', 'badmark');
                        }
                        return spotj;
                    });
                });
            }

            // Whew! Calculate neighbor count.
            var minRow = Math.max(0, row - 1),
                maxRow = Math.min(state.size, row + 2),
                minCol = Math.max(0, column - 1),
                maxCol = Math.min(state.get(0).size, column + 2),
                neighborCount = 0,
                i,
                j,
                thisRow;
            for (i = minRow; i < maxRow; i++) {
                thisRow = state.get(i);
                for (j = minCol; j < maxCol; j++) {
                    if (thisRow.get(j).get('mine')) {
                        neighborCount += 1;
                    }
                }
            }

            newSpot = spot.set('seen', String(neighborCount));
            var newState = state.set(row, rowList.set(column, newSpot));

            if (neighborCount === 0) {
                // reveal all hidden neighbors recursively
                for (i = minRow; i < maxRow; i++) {
                    for (j = minCol; j < maxCol; j++) {
                        if (newState.get(i).get(j).get('seen') === 'unseen') {
                            newState = fieldReducer(newState,
                                {type: 'SHOW', row: i, column: j});
                        }
                    }
                }
            }

            return newState;
        }
        return state;
    default:
        return state;
    }
}

// sometimes we have interactions between the parts of our state.
// does this mean I designed it wrong?
function interactionReducer(state, action) {
    switch (action.type) {
    case 'SHOW':
        // check if we need to change status
        // to 'won' or 'lost'
        var unseen = 0,
            lost = false,
            mines = state.mines;

        state.field.forEach(row => {
            row.forEach(cell => {
                switch (cell.get('seen')) {
                case 'unseen':
                case 'mark':
                    unseen += 1;
                    break;
                case 'mine':
                case 'boom':
                    lost = true;
                    break;
                default:
                    break;
                }
            });
        });

        if (lost) {
            return Object.assign({}, state, {status: 'lost'});
        }
        console.log(unseen, mines);
        if (unseen === mines) {
            return Object.assign({}, state, {status: 'won'});
        }
        return state;
    case 'MARK':
        var marks = 0;
        state.field.forEach(row => {
            row.forEach(cell => {
                if (cell.get('seen') === 'mark') {
                    marks += 1;
                }
            });
        });
        return Object.assign({}, state, {minesLeft: state.mines - marks});
    case 'NEW_MINES':
        var newGame = state.newGame;
        var rows = newGame.get('rows');
        var columns = newGame.get('columns');
        var allMines = newGame.get('mines');
        var fieldRaw = newMineField(rows, columns, allMines);
        var field = Immutable.List(fieldRaw.map((rowi) => {
            return Immutable.List(rowi.map((mine) => {
                return Immutable.Map({mine, seen: 'unseen'});
            }));
        }));
        return Object.assign({}, state, {
            field: field,
            status: 'idle',
            time: 0,
            mines: allMines,
            minesLeft: allMines
        });
    default:
        return state;
    }
}

function mineCountReducer(state = 0) {
    return state;
}

const mainReducer = combineReducers({
    newGame: newGameReducer,
    visibleControls: visibleControlsReducer,
    status: statusReducer,
    time: timeReducer,
    field: fieldReducer,
    minesLeft: mineCountReducer,
    mines: mineCountReducer
});


export function reducer(state, action) {
    var newState = mainReducer(state, action);

    return interactionReducer(newState, action);
}
