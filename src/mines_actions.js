export const setNewGame = ({rows, columns, mines}) => {
    return {
        type: 'SET_NEWGAME',
        rows,
        columns,
        mines
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

export const showCell = (rowNumber, columnNumber) => {
    return {
        type: 'SHOW',
        row: rowNumber,
        column: columnNumber
    };
};

export const markCell = (rowNumber, columnNumber) => {
    return {
        type: 'MARK',
        row: rowNumber,
        column: columnNumber
    };
};

export const tick = () => {
    return {type: 'TICK'};
};