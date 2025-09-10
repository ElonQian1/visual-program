// React高级状态管理和组件通信分析
export interface ReactAdvancedStateAnalysis {
    stateFlow: StateFlowAnalysis;
    componentCommunication: ComponentCommunicationAnalysis;
    dataBinding: DataBindingAnalysis;
    eventHandling: EventHandlingAnalysis;
    contextUsage: ContextUsageAnalysis;
}

export interface StateFlowAnalysis {
    patterns: StateFlowPattern[];
    complexity: 'simple' | 'moderate' | 'complex' | 'very-complex';
    dataFlowDirection: 'unidirectional' | 'bidirectional' | 'mixed';
    stateUpdates: StateUpdatePattern[];
    sideEffects: SideEffectPattern[];
}

export interface StateFlowPattern {
    pattern: 'flux' | 'redux' | 'zustand' | 'recoil' | 'context-reducer' | 'prop-drilling' | 'event-emitter' | 'two-way-binding';
    component: string;
    description: string;
    dataFlow: string[];
    complexity: number;
    line: number;
    recommendations: string[];
}

export interface StateUpdatePattern {
    type: 'synchronous' | 'asynchronous' | 'batched' | 'derived';
    trigger: string;
    updater: string;
    dependencies: string[];
    line: number;
    optimizable: boolean;
}

export interface SideEffectPattern {
    effect: string;
    trigger: string;
    cleanup: boolean;
    dependencies: string[];
    potentialIssues: string[];
    line: number;
}

export interface ComponentCommunicationAnalysis {
    parentChild: ParentChildCommunication[];
    siblingCommunication: SiblingCommunication[];
    crossTreeCommunication: CrossTreeCommunication[];
    eventBubbling: EventBubblingPattern[];
    messagePatterns: MessagePattern[];
}

export interface ParentChildCommunication {
    parent: string;
    child: string;
    propsFlow: PropFlow[];
    callbackFlow: CallbackFlow[];
    refUsage: RefUsagePattern[];
    line: number;
}

export interface PropFlow {
    propName: string;
    type: string;
    direction: 'down' | 'up' | 'bidirectional';
    mutable: boolean;
    line: number;
}

export interface CallbackFlow {
    callbackName: string;
    purpose: string;
    parameters: string[];
    returnType: string;
    line: number;
}

export interface RefUsagePattern {
    refName: string;
    usage: 'dom-access' | 'imperative-api' | 'focus-management' | 'scroll-control' | 'animation';
    line: number;
}

export interface SiblingCommunication {
    components: string[];
    method: 'shared-state' | 'parent-mediated' | 'event-bus' | 'context' | 'global-store';
    efficiency: 'optimal' | 'good' | 'poor' | 'antipattern';
    line: number;
    suggestions: string[];
}

export interface CrossTreeCommunication {
    source: string;
    target: string;
    method: 'context' | 'redux' | 'event-emitter' | 'url-state' | 'local-storage';
    pattern: string;
    line: number;
    complexity: number;
}

export interface EventBubblingPattern {
    event: string;
    propagation: 'default' | 'stopped' | 'prevented';
    handlers: EventHandler[];
    line: number;
}

export interface EventHandler {
    component: string;
    handler: string;
    phase: 'capture' | 'bubble';
    line: number;
}

export interface MessagePattern {
    pattern: 'observer' | 'mediator' | 'command' | 'pub-sub';
    implementation: string;
    components: string[];
    line: number;
    scalability: 'good' | 'poor' | 'needs-improvement';
}

export interface DataBindingAnalysis {
    bindingTypes: DataBindingType[];
    validation: ValidationPattern[];
    serialization: SerializationPattern[];
    transformation: DataTransformationPattern[];
}

export interface DataBindingType {
    type: 'one-way' | 'two-way' | 'one-time' | 'computed';
    source: string;
    target: string;
    performance: 'excellent' | 'good' | 'poor';
    line: number;
    optimizations: string[];
}

export interface ValidationPattern {
    field: string;
    rules: ValidationRule[];
    timing: 'onChange' | 'onBlur' | 'onSubmit' | 'realTime';
    library: string;
    line: number;
}

export interface ValidationRule {
    type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
    value: string;
    message: string;
}

export interface SerializationPattern {
    dataType: string;
    format: 'json' | 'form-data' | 'url-encoded' | 'binary';
    library: string;
    performance: 'fast' | 'moderate' | 'slow';
    line: number;
}

export interface DataTransformationPattern {
    from: string;
    to: string;
    method: 'map' | 'reduce' | 'filter' | 'normalize' | 'denormalize';
    complexity: number;
    cacheable: boolean;
    line: number;
}

export interface EventHandlingAnalysis {
    eventTypes: EventTypeUsage[];
    eventDelegation: EventDelegationPattern[];
    customEvents: CustomEventPattern[];
    eventPerformance: EventPerformanceAnalysis;
}

export interface EventTypeUsage {
    eventType: string;
    frequency: number;
    handlers: string[];
    performance: 'optimal' | 'good' | 'poor';
    line: number;
}

export interface EventDelegationPattern {
    container: string;
    delegatedEvents: string[];
    efficiency: number;
    line: number;
}

export interface CustomEventPattern {
    eventName: string;
    payload: string;
    usage: 'component-internal' | 'cross-component' | 'global';
    line: number;
}

export interface EventPerformanceAnalysis {
    passiveListeners: PassiveListenerUsage[];
    eventThrottling: EventThrottlingPattern[];
    eventDebouncing: EventDebouncingPattern[];
    memoryLeaks: EventMemoryLeak[];
}

export interface PassiveListenerUsage {
    event: string;
    isPassive: boolean;
    shouldBePassive: boolean;
    line: number;
}

export interface EventThrottlingPattern {
    event: string;
    interval: number;
    implementation: string;
    line: number;
}

export interface EventDebouncingPattern {
    event: string;
    delay: number;
    implementation: string;
    line: number;
}

export interface EventMemoryLeak {
    listener: string;
    component: string;
    hasCleanup: boolean;
    line: number;
}

export interface ContextUsageAnalysis {
    contexts: ContextPattern[];
    providers: ContextProviderPattern[];
    consumers: ContextConsumerPattern[];
    performance: ContextPerformanceAnalysis;
}

export interface ContextPattern {
    name: string;
    scope: 'global' | 'feature' | 'component';
    valueType: string;
    updateFrequency: 'never' | 'rare' | 'frequent' | 'constant';
    line: number;
    splitRecommendation?: string;
}

export interface ContextProviderPattern {
    context: string;
    level: number;
    children: number;
    valueStability: 'stable' | 'unstable' | 'optimized';
    line: number;
}

export interface ContextConsumerPattern {
    context: string;
    component: string;
    usage: 'full' | 'partial' | 'minimal';
    rerendersUnnecessarily: boolean;
    line: number;
}

export interface ContextPerformanceAnalysis {
    renderOptimizations: ContextRenderOptimization[];
    valueStabilization: ValueStabilizationPattern[];
    contextSplitting: ContextSplittingRecommendation[];
}

export interface ContextRenderOptimization {
    context: string;
    optimization: 'useMemo' | 'useCallback' | 'context-splitting' | 'selector-pattern';
    impact: 'high' | 'medium' | 'low';
    line: number;
}

export interface ValueStabilizationPattern {
    value: string;
    stabilization: 'useMemo' | 'useCallback' | 'useRef' | 'static';
    dependencies: string[];
    line: number;
}

export interface ContextSplittingRecommendation {
    currentContext: string;
    suggestedSplit: string[];
    reason: string;
    benefits: string[];
    line: number;
}

export class AdvancedReactStateAnalyzer {
    analyzeReactState(text: string, fileName: string): ReactAdvancedStateAnalysis {
        const lines = text.split('\n');
        
        return {
            stateFlow: this.analyzeStateFlow(lines),
            componentCommunication: this.analyzeComponentCommunication(lines),
            dataBinding: this.analyzeDataBinding(lines),
            eventHandling: this.analyzeEventHandling(lines),
            contextUsage: this.analyzeContextUsage(lines)
        };
    }

    private analyzeStateFlow(lines: string[]): StateFlowAnalysis {
        const patterns: StateFlowPattern[] = [];
        const stateUpdates: StateUpdatePattern[] = [];
        const sideEffects: SideEffectPattern[] = [];
        
        lines.forEach((line, index) => {
            // Redux patterns
            if (line.includes('useSelector') || line.includes('useDispatch')) {
                patterns.push({
                    pattern: 'redux',
                    component: this.extractComponentName(line),
                    description: 'Redux状态管理模式',
                    dataFlow: ['store', 'selector', 'component'],
                    complexity: 3,
                    line: index + 1,
                    recommendations: ['使用RTK Query进行异步状态管理', '考虑状态规范化']
                });
            }

            // Zustand patterns
            if (line.includes('create(') && line.includes('set') && line.includes('get')) {
                patterns.push({
                    pattern: 'zustand',
                    component: this.extractComponentName(line),
                    description: 'Zustand轻量级状态管理',
                    dataFlow: ['store', 'component'],
                    complexity: 2,
                    line: index + 1,
                    recommendations: ['考虑订阅优化', '使用shallow比较减少重渲染']
                });
            }

            // Context with useReducer
            if (line.includes('useReducer') && (
                lines.some(l => l.includes('createContext')) ||
                lines.some(l => l.includes('Context.Provider'))
            )) {
                patterns.push({
                    pattern: 'context-reducer',
                    component: this.extractComponentName(line),
                    description: 'Context + useReducer复杂状态管理',
                    dataFlow: ['context', 'reducer', 'component'],
                    complexity: 4,
                    line: index + 1,
                    recommendations: ['拆分Context减少重渲染', '使用useMemo优化value']
                });
            }

            // State updates
            const setStateMatch = line.match(/set[A-Z]\w+\s*\(/);
            if (setStateMatch) {
                stateUpdates.push({
                    type: line.includes('prev') ? 'derived' : 'synchronous',
                    trigger: 'user-action',
                    updater: setStateMatch[0].replace('(', ''),
                    dependencies: this.extractDependencies(line),
                    line: index + 1,
                    optimizable: !line.includes('useCallback')
                });
            }

            // Side effects
            if (line.includes('useEffect')) {
                const cleanup = this.hasEffectCleanup(lines, index);
                const deps = this.extractEffectDependencies(lines, index);
                
                sideEffects.push({
                    effect: this.extractEffectPurpose(line),
                    trigger: deps.length > 0 ? 'dependency-change' : 'mount',
                    cleanup,
                    dependencies: deps,
                    potentialIssues: this.findPotentialEffectIssues(line, deps),
                    line: index + 1
                });
            }
        });

        return {
            patterns,
            complexity: this.calculateStateComplexity(patterns),
            dataFlowDirection: this.determineDataFlowDirection(patterns),
            stateUpdates,
            sideEffects
        };
    }

    private analyzeComponentCommunication(lines: string[]): ComponentCommunicationAnalysis {
        const parentChild: ParentChildCommunication[] = [];
        const siblingCommunication: SiblingCommunication[] = [];
        const crossTreeCommunication: CrossTreeCommunication[] = [];
        const eventBubbling: EventBubblingPattern[] = [];
        const messagePatterns: MessagePattern[] = [];

        lines.forEach((line, index) => {
            // Parent-Child Props Flow
            if (line.includes('<') && line.includes('=') && !line.includes('</')) {
                const propsFlow = this.extractPropsFlow(line);
                if (propsFlow.length > 0) {
                    parentChild.push({
                        parent: 'CurrentComponent',
                        child: this.extractChildComponent(line),
                        propsFlow,
                        callbackFlow: this.extractCallbackFlow(line),
                        refUsage: this.extractRefUsage(line),
                        line: index + 1
                    });
                }
            }

            // Event Bubbling
            if (line.includes('onClick') || line.includes('onSubmit') || line.includes('onInput')) {
                const event = this.extractEventType(line);
                eventBubbling.push({
                    event,
                    propagation: line.includes('stopPropagation') ? 'stopped' : 'default',
                    handlers: [{
                        component: 'current',
                        handler: this.extractEventHandler(line),
                        phase: 'bubble',
                        line: index + 1
                    }],
                    line: index + 1
                });
            }

            // Cross-tree communication via Context
            if (line.includes('useContext')) {
                crossTreeCommunication.push({
                    source: 'ContextProvider',
                    target: 'CurrentComponent',
                    method: 'context',
                    pattern: 'provider-consumer',
                    line: index + 1,
                    complexity: 2
                });
            }

            // Message patterns
            if (line.includes('addEventListener') || line.includes('EventTarget')) {
                messagePatterns.push({
                    pattern: 'pub-sub',
                    implementation: 'DOM Events',
                    components: ['EventPublisher', 'EventSubscriber'],
                    line: index + 1,
                    scalability: 'good'
                });
            }
        });

        return {
            parentChild,
            siblingCommunication,
            crossTreeCommunication,
            eventBubbling,
            messagePatterns
        };
    }

    private analyzeDataBinding(lines: string[]): DataBindingAnalysis {
        const bindingTypes: DataBindingType[] = [];
        const validation: ValidationPattern[] = [];
        const serialization: SerializationPattern[] = [];
        const transformation: DataTransformationPattern[] = [];

        lines.forEach((line, index) => {
            // Two-way binding
            if (line.includes('value=') && line.includes('onChange=')) {
                bindingTypes.push({
                    type: 'two-way',
                    source: 'state',
                    target: 'input',
                    performance: this.evaluateBindingPerformance(line),
                    line: index + 1,
                    optimizations: this.suggestBindingOptimizations(line)
                });
            }

            // One-way binding
            if ((line.includes('value=') || line.includes('checked=')) && !line.includes('onChange=')) {
                bindingTypes.push({
                    type: 'one-way',
                    source: 'state',
                    target: 'element',
                    performance: 'excellent',
                    line: index + 1,
                    optimizations: []
                });
            }

            // Validation patterns
            if (line.includes('required') || line.includes('pattern') || line.includes('min') || line.includes('max')) {
                validation.push({
                    field: this.extractFieldName(line),
                    rules: this.extractValidationRules(line),
                    timing: this.extractValidationTiming(line),
                    library: this.detectValidationLibrary(lines),
                    line: index + 1
                });
            }

            // Data transformation
            if (line.includes('.map(') || line.includes('.filter(') || line.includes('.reduce(')) {
                transformation.push({
                    from: 'array',
                    to: 'transformed-array',
                    method: this.extractTransformationMethod(line),
                    complexity: this.calculateTransformationComplexity(line),
                    cacheable: !line.includes('useCallback') && !line.includes('useMemo'),
                    line: index + 1
                });
            }
        });

        return {
            bindingTypes,
            validation,
            serialization,
            transformation
        };
    }

    private analyzeEventHandling(lines: string[]): EventHandlingAnalysis {
        const eventTypes: EventTypeUsage[] = [];
        const eventDelegation: EventDelegationPattern[] = [];
        const customEvents: CustomEventPattern[] = [];
        const eventPerformance: EventPerformanceAnalysis = {
            passiveListeners: [],
            eventThrottling: [],
            eventDebouncing: [],
            memoryLeaks: []
        };

        lines.forEach((line, index) => {
            // Event types
            const eventMatch = line.match(/on([A-Z]\w+)=/);
            if (eventMatch) {
                const eventType = eventMatch[1].toLowerCase();
                eventTypes.push({
                    eventType,
                    frequency: this.estimateEventFrequency(eventType),
                    handlers: [this.extractEventHandler(line)],
                    performance: this.evaluateEventPerformance(eventType),
                    line: index + 1
                });
            }

            // Event delegation
            if (line.includes('addEventListener') && line.includes('delegate')) {
                eventDelegation.push({
                    container: this.extractContainerElement(line),
                    delegatedEvents: this.extractDelegatedEvents(line),
                    efficiency: 8,
                    line: index + 1
                });
            }

            // Custom events
            if (line.includes('CustomEvent') || line.includes('dispatchEvent')) {
                customEvents.push({
                    eventName: this.extractCustomEventName(line),
                    payload: this.extractEventPayload(line),
                    usage: this.determineEventUsage(line),
                    line: index + 1
                });
            }

            // Performance patterns
            if (line.includes('throttle') || line.includes('lodash.throttle')) {
                eventPerformance.eventThrottling.push({
                    event: this.extractThrottledEvent(line),
                    interval: this.extractThrottleInterval(line),
                    implementation: 'lodash',
                    line: index + 1
                });
            }

            if (line.includes('debounce') || line.includes('lodash.debounce')) {
                eventPerformance.eventDebouncing.push({
                    event: this.extractDebouncedEvent(line),
                    delay: this.extractDebounceDelay(line),
                    implementation: 'lodash',
                    line: index + 1
                });
            }
        });

        return {
            eventTypes,
            eventDelegation,
            customEvents,
            eventPerformance
        };
    }

    private analyzeContextUsage(lines: string[]): ContextUsageAnalysis {
        const contexts: ContextPattern[] = [];
        const providers: ContextProviderPattern[] = [];
        const consumers: ContextConsumerPattern[] = [];
        const performance: ContextPerformanceAnalysis = {
            renderOptimizations: [],
            valueStabilization: [],
            contextSplitting: []
        };

        lines.forEach((line, index) => {
            // Context creation
            if (line.includes('createContext')) {
                contexts.push({
                    name: this.extractContextName(line),
                    scope: this.determineContextScope(line),
                    valueType: this.extractContextValueType(line),
                    updateFrequency: this.estimateUpdateFrequency(line),
                    line: index + 1,
                    splitRecommendation: this.suggestContextSplit(line)
                });
            }

            // Context providers
            if (line.includes('.Provider')) {
                providers.push({
                    context: this.extractProviderContext(line),
                    level: this.calculateProviderLevel(lines, index),
                    children: this.countProviderChildren(lines, index),
                    valueStability: this.analyzeValueStability(lines, index),
                    line: index + 1
                });
            }

            // Context consumers
            if (line.includes('useContext')) {
                consumers.push({
                    context: this.extractContextName(line),
                    component: 'CurrentComponent',
                    usage: this.analyzeContextUsageType(lines, index),
                    rerendersUnnecessarily: this.detectUnnecessaryRerenders(lines, index),
                    line: index + 1
                });
            }

            // Performance optimizations
            if (line.includes('useMemo') && this.isContextValue(lines, index)) {
                performance.valueStabilization.push({
                    value: this.extractMemoizedValue(line),
                    stabilization: 'useMemo',
                    dependencies: this.extractDependencies(line),
                    line: index + 1
                });
            }
        });

        return {
            contexts,
            providers,
            consumers,
            performance
        };
    }

    // Helper methods
    private extractComponentName(line: string): string {
        const match = line.match(/(?:function|const)\s+([A-Z]\w+)/);
        return match ? match[1] : 'Unknown';
    }

    private extractDependencies(line: string): string[] {
        const match = line.match(/\[([^\]]*)\]/);
        return match ? match[1].split(',').map(d => d.trim()).filter(d => d) : [];
    }

    private hasEffectCleanup(lines: string[], index: number): boolean {
        const effectStart = index;
        let braceCount = 0;
        let inEffect = false;

        for (let i = effectStart; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('useEffect')) {inEffect = true;}
            if (!inEffect) {continue;}

            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;

            if (line.includes('return') && line.includes('=>') || line.includes('return function')) {
                return true;
            }

            if (braceCount === 0 && inEffect) {break;}
        }

        return false;
    }

    private extractEffectDependencies(lines: string[], index: number): string[] {
        const line = lines[index];
        const nextLine = lines[index + 1];
        
        // Look for dependency array in current or next line
        const depMatch = (line + (nextLine || '')).match(/\[([^\]]*)\]/);
        if (depMatch) {
            return depMatch[1].split(',').map(d => d.trim()).filter(d => d);
        }
        
        return [];
    }

    private extractEffectPurpose(line: string): string {
        if (line.includes('fetch') || line.includes('axios')) {return 'data-fetching';}
        if (line.includes('addEventListener')) {return 'event-listener';}
        if (line.includes('setInterval') || line.includes('setTimeout')) {return 'timer';}
        if (line.includes('subscription') || line.includes('subscribe')) {return 'subscription';}
        return 'unknown';
    }

    private findPotentialEffectIssues(line: string, deps: string[]): string[] {
        const issues: string[] = [];
        
        if (deps.length === 0 && !line.includes('[]')) {
            issues.push('缺少依赖数组，可能导致无限循环');
        }
        
        if (line.includes('setInterval') && !line.includes('clearInterval')) {
            issues.push('定时器未清理，可能导致内存泄漏');
        }
        
        if (line.includes('addEventListener') && !line.includes('removeEventListener')) {
            issues.push('事件监听器未清理，可能导致内存泄漏');
        }
        
        return issues;
    }

    private calculateStateComplexity(patterns: StateFlowPattern[]): 'simple' | 'moderate' | 'complex' | 'very-complex' {
        const totalComplexity = patterns.reduce((sum, pattern) => sum + pattern.complexity, 0);
        const avgComplexity = totalComplexity / patterns.length;
        
        if (avgComplexity < 2) {return 'simple';}
        if (avgComplexity < 3) {return 'moderate';}
        if (avgComplexity < 4) {return 'complex';}
        return 'very-complex';
    }

    private determineDataFlowDirection(patterns: StateFlowPattern[]): 'unidirectional' | 'bidirectional' | 'mixed' {
        const unidirectional = patterns.filter(p => p.pattern === 'redux' || p.pattern === 'flux').length;
        const bidirectional = patterns.filter(p => p.pattern === 'two-way-binding').length;
        
        if (bidirectional === 0) {return 'unidirectional';}
        if (unidirectional === 0) {return 'bidirectional';}
        return 'mixed';
    }

    // Add more helper methods as needed...
    private extractPropsFlow(line: string): PropFlow[] {
        // Implementation for extracting props flow
        return [];
    }

    private extractCallbackFlow(line: string): CallbackFlow[] {
        // Implementation for extracting callback flow
        return [];
    }

    private extractRefUsage(line: string): RefUsagePattern[] {
        // Implementation for extracting ref usage
        return [];
    }

    private extractChildComponent(line: string): string {
        const match = line.match(/<([A-Z]\w+)/);
        return match ? match[1] : 'Unknown';
    }

    private extractEventType(line: string): string {
        const match = line.match(/on([A-Z]\w+)/);
        return match ? match[1].toLowerCase() : 'unknown';
    }

    private extractEventHandler(line: string): string {
        const match = line.match(/=\{([^}]+)\}/);
        return match ? match[1] : 'unknown';
    }

    private evaluateBindingPerformance(line: string): 'excellent' | 'good' | 'poor' {
        if (line.includes('useCallback') || line.includes('useMemo')) {return 'excellent';}
        if (line.includes('onChange')) {return 'good';}
        return 'poor';
    }

    private suggestBindingOptimizations(line: string): string[] {
        const optimizations: string[] = [];
        if (!line.includes('useCallback')) {
            optimizations.push('使用useCallback优化事件处理器');
        }
        if (!line.includes('useMemo')) {
            optimizations.push('考虑使用useMemo缓存计算值');
        }
        return optimizations;
    }

    private extractFieldName(line: string): string {
        const match = line.match(/name="([^"]+)"/);
        return match ? match[1] : 'unknown';
    }

    private extractValidationRules(line: string): ValidationRule[] {
        const rules: ValidationRule[] = [];
        
        if (line.includes('required')) {
            rules.push({
                type: 'required',
                value: 'true',
                message: '此字段为必填项'
            });
        }
        
        const patternMatch = line.match(/pattern="([^"]+)"/);
        if (patternMatch) {
            rules.push({
                type: 'pattern',
                value: patternMatch[1],
                message: '格式不正确'
            });
        }
        
        return rules;
    }

    private extractValidationTiming(line: string): 'onChange' | 'onBlur' | 'onSubmit' | 'realTime' {
        if (line.includes('onBlur')) {return 'onBlur';}
        if (line.includes('onChange')) {return 'onChange';}
        if (line.includes('onSubmit')) {return 'onSubmit';}
        return 'realTime';
    }

    private detectValidationLibrary(lines: string[]): string {
        if (lines.some(line => line.includes('yup'))) {return 'yup';}
        if (lines.some(line => line.includes('joi'))) {return 'joi';}
        if (lines.some(line => line.includes('zod'))) {return 'zod';}
        if (lines.some(line => line.includes('react-hook-form'))) {return 'react-hook-form';}
        return 'native';
    }

    private extractTransformationMethod(line: string): 'map' | 'reduce' | 'filter' | 'normalize' | 'denormalize' {
        if (line.includes('.map(')) {return 'map';}
        if (line.includes('.reduce(')) {return 'reduce';}
        if (line.includes('.filter(')) {return 'filter';}
        return 'map';
    }

    private calculateTransformationComplexity(line: string): number {
        let complexity = 1;
        if (line.includes('.map(')) {complexity++;}
        if (line.includes('.filter(')) {complexity++;}
        if (line.includes('.reduce(')) {complexity += 2;}
        if (line.includes('=>') && line.includes('{')) {complexity++;}
        return complexity;
    }

    private estimateEventFrequency(eventType: string): number {
        const highFrequency = ['mousemove', 'scroll', 'resize', 'input'];
        const mediumFrequency = ['click', 'keydown', 'change'];
        const lowFrequency = ['submit', 'load', 'focus', 'blur'];
        
        if (highFrequency.includes(eventType)) {return 10;}
        if (mediumFrequency.includes(eventType)) {return 5;}
        if (lowFrequency.includes(eventType)) {return 1;}
        return 3;
    }

    private evaluateEventPerformance(eventType: string): 'optimal' | 'good' | 'poor' {
        const heavyEvents = ['mousemove', 'scroll', 'resize'];
        if (heavyEvents.includes(eventType)) {return 'poor';}
        return 'good';
    }

    private extractContainerElement(line: string): string {
        // Implementation for extracting container element
        return 'div';
    }

    private extractDelegatedEvents(line: string): string[] {
        // Implementation for extracting delegated events
        return ['click'];
    }

    private extractCustomEventName(line: string): string {
        const match = line.match(/new CustomEvent\(['"]([^'"]+)['"]/);
        return match ? match[1] : 'unknown';
    }

    private extractEventPayload(line: string): string {
        const match = line.match(/detail:\s*([^}]+)/);
        return match ? match[1].trim() : 'none';
    }

    private determineEventUsage(line: string): 'component-internal' | 'cross-component' | 'global' {
        if (line.includes('window.') || line.includes('document.')) {return 'global';}
        if (line.includes('parent') || line.includes('bubbles')) {return 'cross-component';}
        return 'component-internal';
    }

    private extractThrottledEvent(line: string): string {
        // Implementation for extracting throttled event
        return 'scroll';
    }

    private extractThrottleInterval(line: string): number {
        const match = line.match(/(\d+)/);
        return match ? parseInt(match[1]) : 100;
    }

    private extractDebouncedEvent(line: string): string {
        // Implementation for extracting debounced event
        return 'input';
    }

    private extractDebounceDelay(line: string): number {
        const match = line.match(/(\d+)/);
        return match ? parseInt(match[1]) : 300;
    }

    private extractContextName(line: string): string {
        const match = line.match(/([A-Z]\w*Context)/);
        return match ? match[1] : 'UnknownContext';
    }

    private determineContextScope(line: string): 'global' | 'feature' | 'component' {
        const name = this.extractContextName(line).toLowerCase();
        if (name.includes('global') || name.includes('app')) {return 'global';}
        if (name.includes('theme') || name.includes('auth') || name.includes('user')) {return 'feature';}
        return 'component';
    }

    private extractContextValueType(line: string): string {
        // Simple type extraction
        if (line.includes('string')) {return 'string';}
        if (line.includes('number')) {return 'number';}
        if (line.includes('boolean')) {return 'boolean';}
        if (line.includes('object') || line.includes('{')) {return 'object';}
        return 'unknown';
    }

    private estimateUpdateFrequency(line: string): 'never' | 'rare' | 'frequent' | 'constant' {
        const name = this.extractContextName(line).toLowerCase();
        if (name.includes('theme') || name.includes('config')) {return 'rare';}
        if (name.includes('user') || name.includes('auth')) {return 'rare';}
        if (name.includes('state') || name.includes('data')) {return 'frequent';}
        return 'frequent';
    }

    private suggestContextSplit(line: string): string | undefined {
        const name = this.extractContextName(line);
        if (name.toLowerCase().includes('app') || name.toLowerCase().includes('global')) {
            return '考虑将大型Context拆分为主题、用户、数据等独立Context';
        }
        return undefined;
    }

    private extractProviderContext(line: string): string {
        const match = line.match(/([A-Z]\w*Context)\.Provider/);
        return match ? match[1] : 'UnknownContext';
    }

    private calculateProviderLevel(lines: string[], index: number): number {
        let level = 0;
        for (let i = 0; i < index; i++) {
            if (lines[i].includes('.Provider')) {level++;}
        }
        return level;
    }

    private countProviderChildren(lines: string[], index: number): number {
        // Simple approximation - count components after provider
        let children = 0;
        for (let i = index + 1; i < Math.min(index + 20, lines.length); i++) {
            if (lines[i].match(/<[A-Z]\w+/)) {children++;}
        }
        return children;
    }

    private analyzeValueStability(lines: string[], index: number): 'stable' | 'unstable' | 'optimized' {
        const line = lines[index];
        if (line.includes('useMemo') || line.includes('useCallback')) {return 'optimized';}
        if (line.includes('value={{')) {return 'unstable';}
        return 'stable';
    }

    private analyzeContextUsageType(lines: string[], index: number): 'full' | 'partial' | 'minimal' {
        const line = lines[index];
        if (line.includes('...context') || line.includes('Object.keys')) {return 'full';}
        if (line.includes('.') && line.split('.').length > 2) {return 'partial';}
        return 'minimal';
    }

    private detectUnnecessaryRerenders(lines: string[], index: number): boolean {
        const line = lines[index];
        // If using full context without memoization
        return line.includes('useContext') && !lines.slice(Math.max(0, index - 3), index + 3)
            .some(l => l.includes('useMemo') || l.includes('useCallback'));
    }

    private extractMemoizedValue(line: string): string {
        const match = line.match(/useMemo\(\s*\(\)\s*=>\s*([^,]+)/);
        return match ? match[1].trim() : 'unknown';
    }

    private isContextValue(lines: string[], index: number): boolean {
        const contextLines = lines.slice(Math.max(0, index - 2), index + 2);
        return contextLines.some(line => line.includes('value=') && line.includes('Provider'));
    }
}
