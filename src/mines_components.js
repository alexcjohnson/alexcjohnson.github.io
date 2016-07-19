import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {
    setNewGame,
    validateNewGame,
    toggleControls,
    hideControls,
    newMines,
    showCell,
    markCell,
    tick
} from './mines_actions';


// The mine field

class Cell extends Component {
    render() {
        var {cls, content, onClick, onContextMenu} = this.props;
        return <div className="fieldcell">
            <div
                className={cls}
                onClick={onClick}
                onContextMenu={onContextMenu}
            >
                {content}
            </div>
        </div>;
    }
}

Cell.propTypes = {
    cls: PropTypes.string,
    content: PropTypes.string,
    onClick: PropTypes.func,
    onContextMenu: PropTypes.func
};

const fieldContent = {
    'unseen': ' ',
    'mark': '\u{1f6a9}',
    'mine': '\u{1f4a3}',
    'boom': '\u{1f4a5}',
    'badmark': '\u{274c}',
    '0': ' ' // 1..8 the content is the string(number)
};

const cellStateToProps = (state, ownProps) => {
    var seen = state.field
            .get(ownProps.rowNumber)
            .get(ownProps.columnNumber)
            .get('seen');
    return {
        cls: 'fieldcell-' + seen,
        content: fieldContent[seen] || seen
    };
};

const cellDispatchToProps = (dispatch, ownProps) => {
    var {rowNumber, columnNumber} = ownProps;
    return {
        onClick: () => {
            dispatch(showCell(rowNumber, columnNumber));
        },
        onContextMenu: (event) => {
            dispatch(markCell(rowNumber, columnNumber));
            event.preventDefault();
        }
    };
};

const FieldCell = connect(cellStateToProps, cellDispatchToProps)(Cell);


class Row extends Component {
    render() {
        var {row, rowNumber} = this.props;
        var cells = row.map((cell, columnNumber) => {
            return <FieldCell
                rowNumber={rowNumber}
                columnNumber={columnNumber}
                key={rowNumber * 1000 + columnNumber}
            />;
        });
        return <div className="fieldrow">{cells}</div>;
    }
}

Row.propTypes = {
    row: PropTypes.object,
    rowNumber: PropTypes.number
};

const rowStateToProps = (state, ownProps) => {
    return {
        row: state.field.get(ownProps.rowNumber)
    };
};

const FieldRow = connect(rowStateToProps)(Row);


class Grid extends Component {
    render() {
        var {field} = this.props;
        var rows = field.map((row, rowNumber) => {
            return <FieldRow rowNumber={rowNumber} key={rowNumber} />;
        });
        return <div className="fieldgrid">{rows}</div>;
    }
}

Grid.propTypes = {
    field: PropTypes.object
};

const gridStateToProps = state => {
    return {
        field: state.field
    };
};

const FieldGrid = connect(gridStateToProps)(Grid);


// New game controls

class Input extends Component {
    render() {
        let i;
        var {title, value, changeValue, doUpdate} = this.props;
        return <div className="mines-control">
            <span>{title}</span>
            <input type="text"
                ref={node => { i = node; }}
                value={value}
                onChange={() => { changeValue(i.value); }}
                onBlur={doUpdate}
            />
        </div>;
    }
}

Input.propTypes = {
    title: PropTypes.string,
    value: PropTypes.string,
    changeValue: PropTypes.func,
    doUpdate: PropTypes.func
};

const inputStateToProps = (state, ownProps) => {
    var itemName = ownProps.item;
    var title = itemName.charAt(0).toUpperCase() + itemName.substr(1);
    var value = String(state.newGame.get(itemName));

    return {title, value};
};

const inputDispatchToProps = (dispatch, ownProps) => {
    var itemName = ownProps.item;
    return {
        changeValue: (value) => {
            dispatch(setNewGame({[itemName]: value}));
        },
        doUpdate: () => {
            dispatch(validateNewGame());
            dispatch(newMines());
        }
    };
};

const NewGameInput = connect(inputStateToProps, inputDispatchToProps)(Input);


class Preset extends Component {
    render() {
        var {checked, title, choosePreset} = this.props;
        return <div className="mines-control">
            <input type="radio" checked={checked} onChange={choosePreset} />
            <span>{title}</span>
        </div>;
    }
}

Preset.propTypes = {
    checked: PropTypes.bool,
    title: PropTypes.string,
    choosePreset: PropTypes.func
};

const presetStateToProps = (state, ownProps) => {
    var newGame = state.newGame;
    var newRows = newGame.get('rows');
    var newColumns = newGame.get('columns');
    var newNumMines = newGame.get('mines');
    var {rows, columns, mines} = ownProps;

    return {
        checked: (rows === newRows) &&
            (columns === newColumns) &&
            (mines === newNumMines)
    };
};

const presetDispatchToProps = (dispatch, ownProps) => {
    return {
        choosePreset: () => {
            dispatch(setNewGame(ownProps));
            dispatch(newMines());
        }
    };
};

const NewGamePreset =
    connect(presetStateToProps, presetDispatchToProps)(Preset);

class Controls extends Component {
    render() {
        if (this.props.isVisible) {
            return <div className="mines-controls">
                <div className="mines-controls-col">
                    <NewGameInput item="rows" />
                    <NewGameInput item="columns" />
                    <NewGameInput item="mines" />
                </div>
                <div className="mines-controls-col">
                    <NewGamePreset title="Beginner"
                        rows={10} columns={10} mines={10}
                    />
                    <NewGamePreset title="Intermediate"
                        rows={16} columns={16} mines={40}
                    />
                    <NewGamePreset title="Expert"
                        rows={16} columns={30} mines={99}
                    />
                </div>
            </div>;
        }
        return <div />;
    }
}

Controls.propTypes = {
    isVisible: PropTypes.bool
};

const controlsStateToProps = state => {
    return {
        isVisible: state.visibleControls
    };
};

const MinesControls = connect(controlsStateToProps)(Controls);


// Info bar

class ShowSetup extends Component {
    render() {
        var {isDisabled, onClick, content} = this.props;
        return <div className="mines-show-setup"
            disabled={isDisabled}
            onClick={isDisabled ? null : onClick}
        >
            {content}
        </div>;
    }
}

ShowSetup.propTypes = {
    isDisabled: PropTypes.bool,
    onClick: PropTypes.func,
    content: PropTypes.string
};

const setupStateToProps = state => {
    return {
        isDisabled: state.status === 'running',
        content: state.visibleControls ? '\u25bc' : '\u25b6'
    };
};

const setupDispatchToProps = dispatch => {
    return {
        onClick: () => {
            dispatch(toggleControls());
        }
    };
};

const MinesShowSetup =
    connect(setupStateToProps, setupDispatchToProps)(ShowSetup);


class Counter extends Component {
    render() {
        return <div className="mines-counter">{this.props.count}</div>;
    }
}

Counter.propTypes = {
    count: PropTypes.number
};

const counterStateToProps = state => {
    return {
        count: state.minesLeft
    };
};

const MinesCounter = connect(counterStateToProps)(Counter);


class StatusButton extends Component {
    render() {
        var {onClick, content} = this.props;
        return <div className="mines-status" onClick={onClick}>
            {content}
        </div>;
    }
}

StatusButton.propTypes = {
    onClick: PropTypes.func,
    content: PropTypes.string
};

const statusEmoji = {
    idle: '\u{1f614}', // pensive face
    running: '\u{1f628}', // fearful face
    won: '\u{1f60d}', // heart eyes
    lost: '\u{1f4a9}' // poo
};

const statusStateToProps = state => {
    return {
        content: statusEmoji[state.status]
    };
};

const statusDispatchToProps = dispatch => {
    return {
        onClick: () => {
            dispatch(newMines());
            dispatch(hideControls());
        }
    };
};

const MinesStatusButton =
    connect(statusStateToProps, statusDispatchToProps)(StatusButton);


let timerInterval = null;

class Timer extends Component {
    render() {
        var {isRunning, time, ticker} = this.props;
        if (isRunning && (timerInterval === null)) {
            timerInterval = setInterval(ticker, 1000);
        }
        if (!isRunning && (timerInterval !== null)) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        return <div className="mines-timer">{time}</div>;
    }
}

Timer.propTypes = {
    isRunning: PropTypes.bool,
    time: PropTypes.number,
    ticker: PropTypes.func
};

const timerStateToProps = state => {
    return {
        isRunning: state.status === 'running',
        time: state.time
    };
};

const timerDispatchToProps = dispatch => {
    return {
        ticker: () => {
            dispatch(tick());
        }
    };
};

const MinesTimer = connect(timerStateToProps, timerDispatchToProps)(Timer);


class InfoBar extends Component {
    render() {
        return <div className="mines-info">
            <MinesShowSetup />
            <MinesCounter />
            <MinesStatusButton />
            <MinesTimer />
        </div>;
    }
}


// putting it all together

export class Game extends Component {
    render() {
        return <div>
            <InfoBar />
            <MinesControls />
            <FieldGrid />
        </div>;
    }
}
