// 测试React性能分析的演示代码
// 这个文件用于测试分析器对React代码的识别能力

// 模拟包含性能问题的React组件代码字符串
export const problematicReactCode = `
import React, { useState, useEffect } from 'react';

const ProblematicComponent = () => {
    const [count, setCount] = useState(0);
    const [data, setData] = useState([]);

    // 性能问题1: 缺少清理的useEffect
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('Running...');
        }, 1000);
        // 忘记清理 - 内存泄漏
    }, []);

    // 性能问题2: 直接DOM操作
    const handleClick = () => {
        document.getElementById('counter').innerHTML = count.toString();
        setCount(count + 1);
    };

    // 性能问题3: 全局变量访问
    const getSize = () => window.innerWidth;

    return React.createElement('div', null,
        React.createElement('button', { 
            onClick: () => setCount(count + 1) // 内联函数
        }, 'Click'),
        React.createElement('div', {
            style: {backgroundColor: 'red'} // 内联样式
        }, 'Styled'),
        data.map(item => React.createElement('div', null, item)) // 缺少key
    );
};
`;

// Redux架构模式示例代码
export const reduxPatternCode = `
import { createStore } from 'redux';
import { Provider } from 'react-redux';

const store = createStore(reducer);
const App = () => React.createElement(Provider, {store}, MainComponent);
`;

// Context架构模式示例代码
export const contextPatternCode = `
import React, { createContext } from 'react';

const ThemeContext = createContext();
const UserContext = createContext();

const App = () => React.createElement(ThemeContext.Provider, {value: theme},
    React.createElement(UserContext.Provider, {value: user}, MainComponent)
);
`;

export default { problematicReactCode, reduxPatternCode, contextPatternCode };
