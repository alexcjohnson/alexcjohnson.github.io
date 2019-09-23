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
        const {cls, content, onClick, onContextMenu, algo} = this.props;
        return <div className="fieldcell">
            <div
                className={cls}
                onClick={onClick(algo)}
                onContextMenu={onContextMenu(algo)}
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
    onContextMenu: PropTypes.func,
    algo: PropTypes.number
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
    const seen = state.field
            .get(ownProps.rowNumber)
            .get(ownProps.columnNumber)
            .get('seen');
    const algo = state.newGame.get('algo');
    return {
        cls: 'fieldcell-' + seen,
        content: fieldContent[seen] || seen,
        algo: algo
    };
};

const cellDispatchToProps = (dispatch, ownProps) => {
    const {rowNumber, columnNumber} = ownProps;
    return {
        onClick: algo => () => {
            dispatch(showCell(rowNumber, columnNumber, algo));
        },
        onContextMenu: algo => (event) => {
            dispatch(markCell(rowNumber, columnNumber, algo));
            event.preventDefault();
        }
    };
};

const FieldCell = connect(cellStateToProps, cellDispatchToProps)(Cell);


class Row extends Component {
    render() {
        const {row, rowNumber} = this.props;
        const cells = row.map((cell, columnNumber) => {
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
        const {field} = this.props;
        const rows = field.map((row, rowNumber) => {
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
        const {title, value, changeValue, doUpdate} = this.props;
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
    const itemName = ownProps.item;
    const title = itemName.charAt(0).toUpperCase() + itemName.substr(1);
    const value = String(state.newGame.get(itemName));

    return {title, value};
};

const inputDispatchToProps = (dispatch, ownProps) => {
    const itemName = ownProps.item;
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
        const {checked, title, choosePreset} = this.props;
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
    const {newGame} = state;
    const newRows = newGame.get('rows');
    const newColumns = newGame.get('columns');
    const newNumMines = newGame.get('mines');
    const {rows, columns, mines} = ownProps;

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

class UnconnectedAlgo extends Component {
    render() {
        const {algo, chooseAlgo} = this.props;
        return <div className="mines-algo">
            <span>Algorithm:</span>
            <input type="radio" checked={!algo} onChange={chooseAlgo(0)} />
            <span>Normal</span>
            <input type="radio" checked={algo === 1} onChange={chooseAlgo(1)} />
            <span>Helpful</span>
        </div>;
    }
}

UnconnectedAlgo.propTypes = {
    algo: PropTypes.number,
    chooseAlgo: PropTypes.func
};

const algoStateToProps = (state) => {
    const {newGame} = state;
    return {algo: newGame.get('algo')};
};

const algoDispatchToProps = (dispatch) => {
    return {
        chooseAlgo: (val) => {
            return () => {
                dispatch(setNewGame({algo: val}));
                dispatch(newMines());
            };
        }
    };
};

const Algo = connect(algoStateToProps, algoDispatchToProps)(UnconnectedAlgo);

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
                <Algo />
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
        const {isDisabled, onClick, content} = this.props;
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
        const {onClick, content} = this.props;
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
        const {isRunning, time, ticker} = this.props;
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
