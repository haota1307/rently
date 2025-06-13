import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { SmartSearchService } from 'src/routes/smart-search/smart-search.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import {
  SmartSearchRequestDto,
  QueryAnalysisRequestDto,
  SmartSearchResponseDto,
  QueryAnalysisResponseDto,
  SearchSuggestionsResponseDto,
} from './smart-search.dto'

@Controller('smart-search')
export class SmartSearchController {
  constructor(private readonly smartSearchService: SmartSearchService) {}

  @Post()
  @IsPublic()
  async search(
    @Body() body: SmartSearchRequestDto,
    @ActiveUser('userId') userId?: number
  ): Promise<SmartSearchResponseDto> {
    return this.smartSearchService.intelligentSearch(body.query, {
      userId,
      additionalFilters: body.filters,
    })
  }

  @Get('suggestions')
  @IsPublic()
  async getSuggestions(
    @Query('q') query: string
  ): Promise<SearchSuggestionsResponseDto> {
    if (!query || query.trim().length < 2) {
      return { suggestions: [] }
    }
    return this.smartSearchService.getSearchSuggestions(query)
  }

  @Post('analyze')
  @IsPublic()
  async analyzeQuery(
    @Body() body: QueryAnalysisRequestDto
  ): Promise<QueryAnalysisResponseDto> {
    return this.smartSearchService.analyzeQuery(body.query)
  }
}
