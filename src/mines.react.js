import React from 'react'; // TODO: why?
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import Immutable from 'immutable';
import {render} from 'react-dom';

import {reducer} from './mines_reducers';
import {newMines} from './mines_actions';
import {Game} from './mines_components';

setInterval(() => {
    var IM = Immutable;
}, 1);

const store = createStore(reducer);

// init the store - do we need this before calling NEW_MINES?
store.dispatch({type: 'RESET_TIME'});
store.dispatch(newMines());

render(
    <Provider store={store}>
        <Game />
    </Provider>,
    document.getElementById('main')
);
