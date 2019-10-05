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
    mines: 10,
    algo: 0
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
        if (typeof action.algo !== 'undefined') {
            newState = newState.set('algo', action.algo);
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

function revealField(state, row, column) {
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

const spotIsMarked = spot => spot.get('seen') === 'mark';
const spotIsMine = spot => spot.get('mine');
const spotIsUnseen = spot => spot.get('seen') === 'unseen';

const iterNeighbors = (state, row, column, func) => {
    const minRow = Math.max(0, row - 1);
    const maxRow = Math.min(state.size, row + 2);
    const minCol = Math.max(0, column - 1);
    const maxCol = Math.min(state.get(0).size, column + 2);

    const inc = (i, j) => ((i === row) && (j + 1 === column) ? 2 : 1);

    for (let i = minRow; i < maxRow; i++) {
        const thisRow = state.get(i);
        for (let j = minCol; j < maxCol; j += inc(i, j)) {
            func(i, j, thisRow.get(j));
        }
    }
};

const getCount = test => (state, row, column) => {
    let cnt = 0;
    iterNeighbors(state, row, column, (i, j, spot) => {
        cnt += test(spot) ? 1 : 0;
    });
    return cnt;
};

const getMarkCount = getCount(spotIsMarked);
const getNeighborCount = getCount(spotIsMine);
const getUnseenCount = getCount(spotIsUnseen);

function markAllUnseen(state, row, column, algo) {
    let newState = state;
    iterNeighbors(state, row, column, (i, j) => {
        const spot = newState.get(i).get(j);
        if (spotIsUnseen(spot)) {
            newState = fieldReducer(
                newState,
                {type: 'MARK', row: i, column: j, algo}
            );
        }
    });
    return newState;
}

function checkForComplete(state, row, column, algo) {
    let newState = state;
    const markCount = getMarkCount(newState, row, column);
    const thisRow = newState.get(row);
    const spot = thisRow.get(column);
    const thisCount = Number(spot.get('seen'));
    if (isNaN(thisCount)) {
        return state;
    }
    const unseenCount = getUnseenCount(newState, row, column);
    if (unseenCount) {
        if (markCount === thisCount) {
            // unshow and reshow
            newState = newState.set(
                row,
                thisRow.set(column, spot.set('seen', 'unseen'))
            );
            newState = fieldReducer(
                newState,
                {type: 'SHOW', row, column, algo}
            );
        }
        else if (markCount + unseenCount === thisCount) {
            newState = markAllUnseen(newState, row, column, algo);
        }
    }
    return newState;
}

function checkForCompletedNeighbors(state, row, column, algo) {
    let newState = state;
    iterNeighbors(state, row, column, (i, j) => {
        newState = checkForComplete(newState, i, j, algo);
    });
    // finally, check this cell itself!
    return checkForComplete(newState, row, column, algo);
}

function revealNeighbors(state, row, column, algo) {
    let newState = state;
    iterNeighbors(state, row, column, (i, j) => {
        if (spotIsUnseen(newState.get(i).get(j))) {
            newState = fieldReducer(newState,
                {type: 'SHOW', row: i, column: j, algo}
            );
        }
    });
    return newState;
}

function fieldReducer(state = Immutable.List(), action) {
    const {type, row, column, algo} = action;
    let rowList, spot, newSpot, newState;
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

        newState = state.set(row, rowList.set(column, newSpot));

        // did we mark enough to finish any of the neighbors?
        if (algo) {
            newState = checkForCompletedNeighbors(newState, row, column, algo);
        }

        return newState;
    case 'SHOW':
        rowList = state.get(row);
        spot = rowList.get(column);
        if (spot.get('seen') === 'unseen') {
            if (spot.get('mine')) {
                // BOOM! Reveal all mines
                return revealField(state, row, column);
            }

            // Whew! Calculate neighbor count.
            const neighborCount = getNeighborCount(state, row, column);
            const neighborMarkCount = getMarkCount(state, row, column);

            newSpot = spot.set('seen', String(neighborCount));
            newState = state.set(row, rowList.set(column, newSpot));

            if (neighborCount === 0 ||
                (algo && (neighborMarkCount === neighborCount))
            ) {
                newState = revealNeighbors(newState, row, column, algo);
                if (algo) {
                    newState = checkForCompletedNeighbors(
                        newState,
                        row,
                        column,
                        algo
                    );
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
    let newState = state;
    switch (action.type) {
    case 'MARK':
        var marks = 0;
        state.field.forEach(row => {
            row.forEach(cell => {
                if (cell.get('seen') === 'mark') {
                    marks += 1;
                }
            });
        });
        newState = Object.assign({}, state, {minesLeft: state.mines - marks});
    /* eslint-disable no-fallthrough */
    case 'SHOW':
    /* eslint-enable no-fallthrough */
        // check if we need to change status
        // to 'won' or 'lost'
        var unseen = 0,
            lost = false,
            mines = state.mines;

        newState.field.forEach(row => {
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
            return Object.assign({}, newState, {status: 'lost'});
        }
        if (unseen === mines) {
            return Object.assign({}, newState, {status: 'won'});
        }
        return newState;
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
