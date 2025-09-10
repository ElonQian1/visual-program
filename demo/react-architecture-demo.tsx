// React高级架构演示
import React, { useState, useContext, useMemo, useCallback } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Provider, useSelector, useDispatch, connect } from 'react-redux';
import { createStore, combineReducers } from 'redux';

// Context模式演示
const ThemeContext = React.createContext('light');

// HOC模式演示
const withAuth = (WrappedComponent) => {
    return (props) => {
        const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
        return isAuthenticated ? <WrappedComponent {...props} /> : <div>Please login</div>;
    };
};

// Render Props模式演示
const DataFetcher = ({ render }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    
    return render({ data, loading, fetchData: () => {} });
};

// 复合组件模式演示
const Modal = ({ children }) => {
    return <div className="modal">{children}</div>;
};

Modal.Header = ({ children }) => <div className="modal-header">{children}</div>;
Modal.Body = ({ children }) => <div className="modal-body">{children}</div>;
Modal.Footer = ({ children }) => <div className="modal-footer">{children}</div>;

// 组件层次结构演示
const UserProfile = ({ user, onUpdate }) => {
    const theme = useContext(ThemeContext);
    
    // 性能优化演示
    const expensiveValue = useMemo(() => {
        return user.permissions.reduce((acc, perm) => acc + perm.weight, 0);
    }, [user.permissions]);
    
    const handleUpdate = useCallback((newData) => {
        onUpdate({ ...user, ...newData });
    }, [user, onUpdate]);
    
    return (
        <div className={`profile-${theme}`}>
            <UserAvatar user={user} />
            <UserDetails user={user} onUpdate={handleUpdate} />
            <UserPermissions permissions={user.permissions} weight={expensiveValue} />
        </div>
    );
};

// 懒加载演示
const LazyUserSettings = React.lazy(() => import('./UserSettings'));

// 状态管理演示 - Redux
const userReducer = (state = { users: [], loading: false }, action) => {
    switch (action.type) {
        case 'FETCH_USERS_START':
            return { ...state, loading: true };
        case 'FETCH_USERS_SUCCESS':
            return { ...state, users: action.payload, loading: false };
        default:
            return state;
    }
};

const rootReducer = combineReducers({
    user: userReducer,
    auth: (state = { isAuthenticated: false }, action) => state
});

const store = createStore(rootReducer);

// 容器/展示组件模式演示
const UserListContainer = connect(
    state => ({ users: state.user.users }),
    dispatch => ({ fetchUsers: () => dispatch({ type: 'FETCH_USERS_START' }) })
)(({ users, fetchUsers }) => <UserList users={users} onFetch={fetchUsers} />);

// Provider模式演示
const App = () => {
    return (
        <Provider store={store}>
            <ThemeContext.Provider value="dark">
                <Router>
                    <Switch>
                        <Route path="/profile" component={withAuth(UserProfile)} />
                        <Route path="/users" component={UserListContainer} />
                        <Route path="/settings" render={() => (
                            <React.Suspense fallback={<div>Loading...</div>}>
                                <LazyUserSettings />
                            </React.Suspense>
                        )} />
                    </Switch>
                </Router>
            </ThemeContext.Provider>
        </Provider>
    );
};

export default App;
