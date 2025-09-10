/**
 * AI增强代码分析器集成测试
 * 验证所有分析器模块的正确集成和功能
 */

const assert = require('assert');
const path = require('path');

// 模拟VSCode环境
global.vscode = {
    window: {
        showInformationMessage: () => {},
        showErrorMessage: () => {},
        showTextDocument: () => Promise.resolve()
    },
    workspace: {
        getWorkspaceFolder: () => ({ uri: { fsPath: __dirname } })
    },
    Uri: {
        file: (path) => ({ fsPath: path })
    },
    Position: class Position {},
    Selection: class Selection {},
    Range: class Range {}
};

// 测试AI增强分析器
async function testAIEnhancedAnalyzer() {
    console.log('🧠 测试AI增强分析器...');
    
    try {
        const { AIEnhancedAnalyzer } = require('../out/aiEnhancedAnalyzer');
        const analyzer = new AIEnhancedAnalyzer();
        
        const testCode = `
        import React, { useState, useEffect } from 'react';
        
        function MyComponent(props) {
            const [count, setCount] = useState(0);
            const [data, setData] = useState(null);
            
            useEffect(() => {
                // 潜在性能问题：没有依赖数组
                fetchData();
            });
            
            const fetchData = async () => {
                const response = await fetch('/api/data');
                setData(response.json()); // 缺少await
            };
            
            return (
                <div>
                    <p>Count: {count}</p>
                    <button onClick={() => setCount(count + 1)}>+</button>
                </div>
            );
        }`;
        
        const analysis = await analyzer.analyzeCode(testCode, 'test.tsx');
        
        assert(analysis.insights.length > 0, '应该发现代码洞察');
        assert(analysis.codeSmells.length > 0, '应该检测到代码坏味道');
        assert(analysis.suggestions.length > 0, '应该提供改进建议');
        
        console.log('✅ AI增强分析器测试通过');
        console.log(`   - 发现 ${analysis.insights.length} 个洞察`);
        console.log(`   - 检测到 ${analysis.codeSmells.length} 个代码坏味道`);
        console.log(`   - 提供 ${analysis.suggestions.length} 个建议`);
        
    } catch (error) {
        console.error('❌ AI增强分析器测试失败:', error.message);
        throw error;
    }
}

// 测试深度性能分析器
async function testDeepPerformanceAnalyzer() {
    console.log('⚡ 测试深度性能分析器...');
    
    try {
        const { DeepPerformanceAnalyzer } = require('../out/deepPerformanceAnalyzer');
        const analyzer = new DeepPerformanceAnalyzer();
        
        const testRustCode = `
        use std::collections::HashMap;
        
        fn inefficient_function(data: Vec<i32>) -> i32 {
            let mut map = HashMap::new();
            
            // O(n²) 算法复杂度问题
            for i in &data {
                for j in &data {
                    if i + j == 10 {
                        map.insert(*i, *j);
                    }
                }
            }
            
            // 可能的性能瓶颈
            data.iter().sum()
        }`;
        
        const analysis = await analyzer.analyzePerformance(testRustCode, 'test.rs');
        
        assert(analysis.overallScore >= 0, '应该有总体性能评分');
        assert(analysis.bottlenecks.length > 0, '应该检测到性能瓶颈');
        assert(analysis.suggestions.length > 0, '应该提供优化建议');
        
        console.log('✅ 深度性能分析器测试通过');
        console.log(`   - 总体评分: ${analysis.overallScore}/100`);
        console.log(`   - 发现 ${analysis.bottlenecks.length} 个性能瓶颈`);
        console.log(`   - 提供 ${analysis.suggestions.length} 个优化建议`);
        
    } catch (error) {
        console.error('❌ 深度性能分析器测试失败:', error.message);
        throw error;
    }
}

// 测试综合质量检测器
async function testComprehensiveQualityDetector() {
    console.log('📊 测试综合质量检测器...');
    
    try {
        const { ComprehensiveCodeQualityDetector } = require('../out/comprehensiveCodeQualityDetector');
        const detector = new ComprehensiveCodeQualityDetector();
        
        const mockAnalysisData = {
            complexity: 15,
            maintainabilityIndex: 70,
            testCoverage: 80,
            duplicateCode: 5,
            dependencies: ['react', 'lodash']
        };
        
        const qualityReport = await detector.generateComprehensiveReport(
            'test.tsx', 
            mockAnalysisData
        );
        
        assert(qualityReport.overallScore >= 0, '应该有总体质量评分');
        assert(qualityReport.dimensions, '应该有各维度评分');
        assert(qualityReport.criticalIssues, '应该有关键问题列表');
        assert(qualityReport.suggestions.length > 0, '应该有改进建议');
        
        console.log('✅ 综合质量检测器测试通过');
        console.log(`   - 总体评分: ${qualityReport.overallScore}/100`);
        console.log(`   - 关键问题: ${qualityReport.criticalIssues.length} 个`);
        console.log(`   - 改进建议: ${qualityReport.suggestions.length} 个`);
        
    } catch (error) {
        console.error('❌ 综合质量检测器测试失败:', error.message);
        throw error;
    }
}

// 测试增强代码生成引擎
async function testEnhancedCodeGenerationEngine() {
    console.log('🚀 测试增强代码生成引擎...');
    
    try {
        const { EnhancedCodeGenerationEngine } = require('../out/enhancedCodeGenerationEngine');
        const engine = new EnhancedCodeGenerationEngine();
        
        // 测试React组件生成
        const reactTemplate = await engine.generateReactComponent('UserProfile', {
            props: ['user', 'onEdit'],
            hooks: ['useState', 'useEffect'],
            styling: 'css-modules'
        });
        
        assert(reactTemplate.component.includes('UserProfile'), '应该包含组件名');
        assert(reactTemplate.component.includes('useState'), '应该包含Hook');
        assert(reactTemplate.optimizations.length > 0, '应该有优化建议');
        
        // 测试Rust模块生成
        const rustTemplate = await engine.generateRustModule('DataProcessor', {
            features: ['serde', 'async'],
            errorHandling: 'Result',
            patterns: ['builder']
        });
        
        assert(rustTemplate.module.includes('DataProcessor'), '应该包含模块名');
        assert(rustTemplate.module.includes('Result'), '应该包含错误处理');
        assert(rustTemplate.performanceNotes.length > 0, '应该有性能注意事项');
        
        console.log('✅ 增强代码生成引擎测试通过');
        console.log('   - React组件生成: ✓');
        console.log('   - Rust模块生成: ✓');
        console.log('   - 优化建议集成: ✓');
        
    } catch (error) {
        console.error('❌ 增强代码生成引擎测试失败:', error.message);
        throw error;
    }
}

// 测试主分析器集成
async function testMainAnalyzerIntegration() {
    console.log('🔧 测试主分析器集成...');
    
    try {
        const { CodeAnalyzer } = require('../out/codeAnalyzer');
        const analyzer = new CodeAnalyzer();
        
        const testCode = `
        import React, { useState } from 'react';
        
        export const TestComponent = () => {
            const [count, setCount] = useState(0);
            return <div>{count}</div>;
        };`;
        
        const analysis = await analyzer.analyzeFile(testCode, 'test.tsx');
        
        // 验证所有分析器的结果都包含在内
        assert(analysis.aiEnhancedAnalysis, '应该包含AI增强分析结果');
        assert(analysis.deepPerformanceAnalysis, '应该包含深度性能分析结果');
        assert(analysis.comprehensiveQualityReport, '应该包含综合质量报告');
        
        // 验证专项分析结果
        if (analysis.reactHookOptimization) {
            assert(analysis.reactHookOptimization.overallScore >= 0, '应该有Hook优化评分');
        }
        
        console.log('✅ 主分析器集成测试通过');
        console.log('   - AI增强分析: ✓');
        console.log('   - 深度性能分析: ✓');
        console.log('   - 综合质量检测: ✓');
        console.log('   - 专项优化分析: ✓');
        
    } catch (error) {
        console.error('❌ 主分析器集成测试失败:', error.message);
        throw error;
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('🚀 开始AI增强代码分析器集成测试...\n');
    
    const tests = [
        testAIEnhancedAnalyzer,
        testDeepPerformanceAnalyzer,
        testComprehensiveQualityDetector,
        testEnhancedCodeGenerationEngine,
        testMainAnalyzerIntegration
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            await test();
            passed++;
        } catch (error) {
            failed++;
            console.error(`测试失败: ${error.message}\n`);
        }
        console.log(''); // 空行分隔
    }
    
    console.log('📋 测试总结:');
    console.log(`✅ 通过: ${passed} 个测试`);
    console.log(`❌ 失败: ${failed} 个测试`);
    
    if (failed === 0) {
        console.log('\n🎉 所有集成测试通过！AI增强代码分析器已准备就绪。');
        console.log('\n💡 下一步建议:');
        console.log('1. 使用 "分析代码结构" 命令测试实际文件');
        console.log('2. 查看可视化面板中的AI分析结果');
        console.log('3. 验证性能建议和质量评分');
        console.log('4. 测试代码生成功能');
    } else {
        console.log('\n⚠️ 部分测试失败，请检查错误信息并修复问题。');
        process.exit(1);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    testAIEnhancedAnalyzer,
    testDeepPerformanceAnalyzer,
    testComprehensiveQualityDetector,
    testEnhancedCodeGenerationEngine,
    testMainAnalyzerIntegration,
    runAllTests
};
