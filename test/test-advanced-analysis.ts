/**
 * 快速测试脚本 - 验证高级架构分析功能
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CodeAnalyzer } from '../src/codeAnalyzer';

export async function testAdvancedArchitectureAnalysis() {
    console.log('🚀 开始测试高级架构分析功能...');

    const analyzer = new CodeAnalyzer();
    
    // 测试React高级架构分析
    console.log('\n📊 测试React高级架构分析...');
    try {
        const reactDemoPath = path.join(__dirname, '..', 'demo', 'advanced-architecture-demo.tsx');
        if (fs.existsSync(reactDemoPath)) {
            const reactUri = vscode.Uri.file(reactDemoPath);
            const reactDocument = await vscode.workspace.openTextDocument(reactUri);
            const reactAnalysis = await analyzer.analyzeFile(reactDocument);
            
            console.log('✅ React分析完成');
            if (reactAnalysis.reactAdvancedArchitectureAnalysis) {
                const arch = reactAnalysis.reactAdvancedArchitectureAnalysis;
                console.log(`   - 总分: ${arch.overallScore}/100`);
                console.log(`   - 架构模式: ${arch.architecturePatterns.length}个`);
                console.log(`   - 性能问题: ${arch.performanceIssues.length}个`);
                console.log(`   - 最佳实践违规: ${arch.bestPracticeViolations.length}个`);
                console.log(`   - 组件分析: ${arch.componentAnalysis.length}个组件`);
                
                // 显示一些具体的分析结果
                if (arch.architecturePatterns.length > 0) {
                    console.log('\n   🏛️ 检测到的架构模式:');
                    arch.architecturePatterns.slice(0, 3).forEach((pattern, i) => {
                        console.log(`      ${i + 1}. ${pattern.name} (${pattern.type}) - 置信度: ${pattern.confidence}%`);
                    });
                }
                
                if (arch.performanceIssues.length > 0) {
                    console.log('\n   ⚡ 性能问题:');
                    arch.performanceIssues.slice(0, 3).forEach((issue, i) => {
                        console.log(`      ${i + 1}. ${issue.type} - ${issue.severity} - ${issue.issue}`);
                    });
                }
            }
        } else {
            console.log('❌ React演示文件未找到');
        }
    } catch (error) {
        console.error('❌ React分析失败:', error);
    }

    // 测试Rust高级架构分析
    console.log('\n🦀 测试Rust高级架构分析...');
    try {
        const rustDemoPath = path.join(__dirname, '..', 'demo', 'advanced-architecture-demo.rs');
        if (fs.existsSync(rustDemoPath)) {
            const rustUri = vscode.Uri.file(rustDemoPath);
            const rustDocument = await vscode.workspace.openTextDocument(rustUri);
            const rustAnalysis = await analyzer.analyzeFile(rustDocument);
            
            console.log('✅ Rust分析完成');
            if (rustAnalysis.rustAdvancedArchitectureAnalysis) {
                const arch = rustAnalysis.rustAdvancedArchitectureAnalysis;
                console.log(`   - 总分: ${arch.overallScore}/100`);
                console.log(`   - 架构模式: ${arch.architecturePatterns.length}个`);
                console.log(`   - 性能问题: ${arch.performanceIssues.length}个`);
                console.log(`   - 安全问题: ${arch.safetyIssues.length}个`);
                console.log(`   - 模块分析: ${arch.moduleAnalysis.length}个模块`);
                
                // 显示一些具体的分析结果
                if (arch.architecturePatterns.length > 0) {
                    console.log('\n   🏗️ 检测到的架构模式:');
                    arch.architecturePatterns.slice(0, 3).forEach((pattern, i) => {
                        console.log(`      ${i + 1}. ${pattern.name} (${pattern.type}) - 置信度: ${pattern.confidence}%`);
                    });
                }
                
                if (arch.performanceIssues.length > 0) {
                    console.log('\n   ⚡ 性能问题:');
                    arch.performanceIssues.slice(0, 3).forEach((issue, i) => {
                        console.log(`      ${i + 1}. ${issue.type} - ${issue.severity} - ${issue.issue}`);
                    });
                }
                
                if (arch.safetyIssues.length > 0) {
                    console.log('\n   🛡️ 安全问题:');
                    arch.safetyIssues.slice(0, 3).forEach((issue, i) => {
                        console.log(`      ${i + 1}. ${issue.type} - ${issue.severity} - ${issue.message}`);
                    });
                }
            }
        } else {
            console.log('❌ Rust演示文件未找到');
        }
    } catch (error) {
        console.error('❌ Rust分析失败:', error);
    }

    console.log('\n🎉 高级架构分析测试完成！');
}

// 导出测试函数供VSCode命令调用
export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('visual-programming.testAdvancedAnalysis', testAdvancedArchitectureAnalysis);
    context.subscriptions.push(disposable);
}
