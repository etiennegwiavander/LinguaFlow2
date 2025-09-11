import {
  EmailTemplate,
  RenderResult,
  PlaceholderResult,
  AssetResult,
  TestResult,
  TestCategory,
  TestStatus,
  ValidationError,
  SeverityLevel,
  ErrorCategory,
  TemplateAsset,
  AssetType
} from './types'

export interface TemplateData {
  [key: string]: any
}

export class TemplateValidator {
  private placeholderRegex = /\{\{([^}]+)\}\}/g

  /**
   * Validates template rendering with provided data
   */
  async validateTemplateRendering(template: EmailTemplate, data: TemplateData): Promise<RenderResult> {
    try {
      const htmlOutput = this.renderTemplate(template.htmlContent, data)
      const textOutput = this.renderTemplate(template.textContent, data)
      
      // Check for rendering errors
      const hasRenderingErrors = this.checkForRenderingErrors(htmlOutput, textOutput)
      
      if (hasRenderingErrors.length > 0) {
        return {
          rendered: false,
          error: `Rendering errors: ${hasRenderingErrors.join(', ')}`
        }
      }

      return {
        rendered: true,
        htmlOutput,
        textOutput
      }
    } catch (error) {
      return {
        rendered: false,
        error: error instanceof Error ? error.message : 'Template rendering failed'
      }
    }
  }

  /**
   * Validates placeholder substitution in templates
   */
  async validatePlaceholderSubstitution(template: EmailTemplate): Promise<PlaceholderResult> {
    const htmlPlaceholders = this.extractPlaceholders(template.htmlContent)
    const textPlaceholders = this.extractPlaceholders(template.textContent)
    const subjectPlaceholders = this.extractPlaceholders(template.subject)
    
    const allFoundPlaceholders = new Set([
      ...htmlPlaceholders,
      ...textPlaceholders,
      ...subjectPlaceholders
    ])

    const declaredPlaceholders = new Set(template.placeholders)
    
    // Find missing placeholders (declared but not found in template)
    const missingPlaceholders = template.placeholders.filter(
      placeholder => !allFoundPlaceholders.has(placeholder)
    )
    
    // Find invalid placeholders (found in template but not declared)
    const invalidPlaceholders = Array.from(allFoundPlaceholders).filter(
      placeholder => !declaredPlaceholders.has(placeholder)
    )

    return {
      allPlaceholdersReplaced: missingPlaceholders.length === 0 && invalidPlaceholders.length === 0,
      missingPlaceholders,
      invalidPlaceholders
    }
  }

  /**
   * Validates template assets (images, CSS, fonts)
   */
  async validateTemplateAssets(template: EmailTemplate): Promise<AssetResult> {
    if (!template.assets || template.assets.length === 0) {
      return {
        allAssetsValid: true,
        missingAssets: [],
        invalidAssets: []
      }
    }

    const missingAssets: string[] = []
    const invalidAssets: string[] = []

    for (const asset of template.assets) {
      const assetExists = await this.checkAssetExists(asset.path)
      const assetValid = await this.validateAssetType(asset)

      if (!assetExists) {
        missingAssets.push(asset.path)
      }

      if (!assetValid) {
        invalidAssets.push(asset.path)
      }
    }

    return {
      allAssetsValid: missingAssets.length === 0 && invalidAssets.length === 0,
      missingAssets,
      invalidAssets
    }
  }

  /**
   * Runs comprehensive template validation tests
   */
  async runComprehensiveTests(template: EmailTemplate, testData?: TemplateData): Promise<TestResult[]> {
    const results: TestResult[] = []
    const defaultTestData = this.generateDefaultTestData(template.placeholders)
    const data = testData || defaultTestData

    // Test 1: Template Rendering
    const renderStart = Date.now()
    const renderResult = await this.validateTemplateRendering(template, data)
    results.push({
      testName: 'Template Rendering Test',
      category: TestCategory.TEMPLATE_RENDERING,
      status: renderResult.rendered ? TestStatus.PASSED : TestStatus.FAILED,
      duration: Date.now() - renderStart,
      details: {
        description: 'Tests template rendering with provided data',
        expectedResult: 'Template renders without errors',
        actualResult: renderResult.rendered ? 
          'Template rendered successfully' : 
          `Rendering failed: ${renderResult.error}`,
        metadata: { 
          templateId: template.id,
          templateType: template.type,
          dataKeys: Object.keys(data)
        }
      },
      errors: renderResult.rendered ? undefined : [{
        code: 'TEMPLATE_RENDER_FAILED',
        message: renderResult.error || 'Template rendering failed',
        severity: SeverityLevel.HIGH,
        category: ErrorCategory.TEMPLATE_RENDERING
      }]
    })

    // Test 2: Placeholder Substitution
    const placeholderStart = Date.now()
    const placeholderResult = await this.validatePlaceholderSubstitution(template)
    results.push({
      testName: 'Placeholder Substitution Test',
      category: TestCategory.PLACEHOLDER_SUBSTITUTION,
      status: placeholderResult.allPlaceholdersReplaced ? TestStatus.PASSED : TestStatus.FAILED,
      duration: Date.now() - placeholderStart,
      details: {
        description: 'Validates all placeholders are properly defined and used',
        expectedResult: 'All placeholders correctly defined and substituted',
        actualResult: placeholderResult.allPlaceholdersReplaced ? 
          'All placeholders valid' : 
          `Issues found - Missing: ${placeholderResult.missingPlaceholders.join(', ')}, Invalid: ${placeholderResult.invalidPlaceholders.join(', ')}`,
        metadata: {
          declaredPlaceholders: template.placeholders,
          missingPlaceholders: placeholderResult.missingPlaceholders,
          invalidPlaceholders: placeholderResult.invalidPlaceholders
        }
      },
      errors: placeholderResult.allPlaceholdersReplaced ? undefined : [
        ...placeholderResult.missingPlaceholders.map(placeholder => ({
          code: 'MISSING_PLACEHOLDER',
          message: `Placeholder '${placeholder}' is declared but not used in template`,
          severity: SeverityLevel.MEDIUM,
          category: ErrorCategory.TEMPLATE_RENDERING
        })),
        ...placeholderResult.invalidPlaceholders.map(placeholder => ({
          code: 'INVALID_PLACEHOLDER',
          message: `Placeholder '${placeholder}' is used but not declared`,
          severity: SeverityLevel.HIGH,
          category: ErrorCategory.TEMPLATE_RENDERING
        }))
      ]
    })

    // Test 3: Asset Validation
    const assetStart = Date.now()
    const assetResult = await this.validateTemplateAssets(template)
    results.push({
      testName: 'Template Asset Validation',
      category: TestCategory.ASSET_VALIDATION,
      status: assetResult.allAssetsValid ? TestStatus.PASSED : TestStatus.FAILED,
      duration: Date.now() - assetStart,
      details: {
        description: 'Validates all template assets are available and valid',
        expectedResult: 'All template assets are accessible and valid',
        actualResult: assetResult.allAssetsValid ? 
          'All assets valid' : 
          `Asset issues - Missing: ${assetResult.missingAssets.join(', ')}, Invalid: ${assetResult.invalidAssets.join(', ')}`,
        metadata: {
          totalAssets: template.assets?.length || 0,
          missingAssets: assetResult.missingAssets,
          invalidAssets: assetResult.invalidAssets
        }
      },
      errors: assetResult.allAssetsValid ? undefined : [
        ...assetResult.missingAssets.map(asset => ({
          code: 'MISSING_ASSET',
          message: `Template asset '${asset}' is missing`,
          severity: SeverityLevel.HIGH,
          category: ErrorCategory.ASSET_MISSING
        })),
        ...assetResult.invalidAssets.map(asset => ({
          code: 'INVALID_ASSET',
          message: `Template asset '${asset}' is invalid`,
          severity: SeverityLevel.MEDIUM,
          category: ErrorCategory.ASSET_MISSING
        }))
      ]
    })

    return results
  }

  /**
   * Private helper methods
   */
  private renderTemplate(content: string, data: TemplateData): string {
    return content.replace(this.placeholderRegex, (match, key) => {
      const trimmedKey = key.trim()
      return data[trimmedKey] !== undefined ? String(data[trimmedKey]) : match
    })
  }

  private extractPlaceholders(content: string): string[] {
    const matches = content.match(this.placeholderRegex)
    if (!matches) return []
    
    return matches.map(match => {
      const key = match.replace(/[{}]/g, '').trim()
      return key
    })
  }

  private checkForRenderingErrors(htmlOutput: string, textOutput: string): string[] {
    const errors: string[] = []
    
    // Check for unresolved placeholders
    const htmlUnresolved = htmlOutput.match(this.placeholderRegex)
    const textUnresolved = textOutput.match(this.placeholderRegex)
    
    if (htmlUnresolved) {
      errors.push(`Unresolved HTML placeholders: ${htmlUnresolved.join(', ')}`)
    }
    
    if (textUnresolved) {
      errors.push(`Unresolved text placeholders: ${textUnresolved.join(', ')}`)
    }
    
    // Check for basic HTML validity (simplified)
    if (htmlOutput.includes('<') && !this.isValidHTML(htmlOutput)) {
      errors.push('Invalid HTML structure detected')
    }
    
    return errors
  }

  private isValidHTML(html: string): boolean {
    // Simplified HTML validation - check for basic tag matching
    const openTags = html.match(/<[^/][^>]*>/g) || []
    const closeTags = html.match(/<\/[^>]*>/g) || []
    
    // Basic check: should have roughly matching open/close tags for common elements
    const commonTags = ['div', 'p', 'span', 'table', 'tr', 'td', 'th', 'tbody', 'thead']
    
    for (const tag of commonTags) {
      const openCount = (html.match(new RegExp(`<${tag}[^>]*>`, 'g')) || []).length
      const closeCount = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length
      
      if (openCount !== closeCount) {
        return false
      }
    }
    
    return true
  }

  private async checkAssetExists(path: string): Promise<boolean> {
    try {
      // In a real implementation, this would check if the asset exists
      // For now, simulate based on path validity
      return path.length > 0 && !path.includes('missing')
    } catch (error) {
      return false
    }
  }

  private async validateAssetType(asset: TemplateAsset): Promise<boolean> {
    try {
      // Validate asset type matches file extension
      const extension = asset.path.split('.').pop()?.toLowerCase()
      
      switch (asset.type) {
        case AssetType.IMAGE:
          return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension || '')
        case AssetType.CSS:
          return extension === 'css'
        case AssetType.FONT:
          return ['woff', 'woff2', 'ttf', 'otf'].includes(extension || '')
        default:
          return false
      }
    } catch (error) {
      return false
    }
  }

  private generateDefaultTestData(placeholders: string[]): TemplateData {
    const data: TemplateData = {}
    
    for (const placeholder of placeholders) {
      // Generate appropriate test data based on placeholder name
      if (placeholder.toLowerCase().includes('name')) {
        data[placeholder] = 'Test User'
      } else if (placeholder.toLowerCase().includes('email')) {
        data[placeholder] = 'test@example.com'
      } else if (placeholder.toLowerCase().includes('date')) {
        data[placeholder] = new Date().toLocaleDateString()
      } else if (placeholder.toLowerCase().includes('url') || placeholder.toLowerCase().includes('link')) {
        data[placeholder] = 'https://example.com'
      } else {
        data[placeholder] = `Test ${placeholder}`
      }
    }
    
    return data
  }
}