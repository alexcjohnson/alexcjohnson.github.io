export const setNewGame = ({rows, columns, mines, algo}) => {
    return {
        type: 'SET_NEWGAME',
        rows,
        columns,
        mines,
        algo
    };
};

export const validateNewGame = () => {
    return {type: 'VALIDATE_NEWGAME'};
};

export const toggleControls = () => {
    return {type: 'TOGGLE_CONTROLS'};
};

export const hideControls = () => {
    return {type: 'HIDE_CONTROLS'};
};

export const newMines = () => {
    return {type: 'NEW_MINES'};
};

export const showCell = (rowNumber, columnNumber, algo) => {
    return {
        type: 'SHOW',
        row: rowNumber,
        column: columnNumber,
        algo
    };
};

export const markCell = (rowNumber, columnNumber, algo) => {
    return {
        type: 'MARK',
        row: rowNumber,
        column: columnNumber,
        algo
    };
};

export const tick = () => {
    return {type: 'TICK'};
};
