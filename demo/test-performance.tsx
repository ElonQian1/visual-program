import React, { useState, useEffect } from 'react';

// 这个组件有多个性能问题
const ProblematicComponent = () => {
    const [count, setCount] = useState(0);
    const [name, setName] = useState('');

    // 性能问题1: 缺少清理的useEffect
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('Running...');
        }, 1000);
        // 忘记清理interval - 内存泄漏
    }, []);

    // 性能问题2: 直接操作DOM
    const handleClick = () => {
        document.getElementById('counter').innerHTML = count.toString();
        setCount(count + 1);
    };

    // 性能问题3: 全局变量访问
    const getWindowWidth = () => {
        return window.innerWidth;
    };

    return (
        <div>
            <h1>性能问题演示组件</h1>
            {/* 性能问题4: 内联函数 */}
            <button onClick={() => setCount(count + 1)}>
                点击计数: {count}
            </button>
            
            {/* 性能问题5: 内联样式对象 */}
            <div style={{backgroundColor: 'red', padding: '10px'}}>
                样式内联
            </div>
            
            {/* 性能问题6: 列表没有key */}
            {[1, 2, 3].map(item => (
                <div>Item {item}</div>
            ))}
            
            <div id="counter">{count}</div>
            <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入名称"
            />
        </div>
    );
};

export default ProblematicComponent;
