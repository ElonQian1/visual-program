/**
 * 懒加载组件演示
 * 用于代码分割测试
 */

import React from 'react';

const LazyLoadedComponent: React.FC = () => {
    return (
        <div className="lazy-component">
            <h2>懒加载组件</h2>
            <p>这是一个通过代码分割懒加载的组件</p>
            <div className="feature-list">
                <h3>特性：</h3>
                <ul>
                    <li>按需加载，减少初始包大小</li>
                    <li>提升首屏加载性能</li>
                    <li>支持Suspense边界</li>
                    <li>自动代码分割</li>
                </ul>
            </div>
        </div>
    );
};

export default LazyLoadedComponent;
