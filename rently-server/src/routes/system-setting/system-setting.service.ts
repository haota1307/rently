import { Injectable } from '@nestjs/common'
import { SystemSettingRepository } from 'src/shared/repositories/system-setting.repo'
import {
  CreateSystemSettingType,
  GetSystemSettingByGroupType,
  UpdateSystemSettingType,
} from './system-setting.model'
import { NotFoundRecordException } from 'src/shared/error'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class SystemSettingService {
  constructor(
    private readonly systemSettingRepository: SystemSettingRepository
  ) {}

  async getAllSettings() {
    return this.systemSettingRepository.findAll()
  }

  async getSettingByKey(key: string) {
    const setting = await this.systemSettingRepository.findByKey(key)
    if (!setting) {
      throw NotFoundRecordException
    }
    return setting
  }

  async getSettingsByGroup({ group }: GetSystemSettingByGroupType) {
    return this.systemSettingRepository.findByGroup(group)
  }

  async getEmailTemplates() {
    try {
      const emailsDir = path.join(process.cwd(), 'emails')
      const emailFiles = fs
        .readdirSync(emailsDir)
        .filter(file => file.endsWith('.tsx'))

      const templates: Array<{
        name: string
        fileName: string
        key: string
        content: string
      }> = []

      // Đọc nội dung của các file email template
      for (const file of emailFiles) {
        const filePath = path.join(emailsDir, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        const templateName = file.replace('.tsx', '')

        templates.push({
          name: templateName,
          fileName: file,
          key: `email_${templateName.replace('-', '_')}_template`,
          content: content,
        })
      }

      return {
        success: true,
        templates,
      }
    } catch (error) {
      console.error('Error loading email templates:', error)
      return {
        success: false,
        error: error.message,
        templates: [],
      }
    }
  }

  async createSetting({
    key,
    value,
    type,
    group,
    description,
    userId,
  }: CreateSystemSettingType & { userId: number }) {
    // Kiểm tra xem setting đã tồn tại chưa
    const existingSetting = await this.systemSettingRepository.findByKey(key)
    if (existingSetting) {
      return this.systemSettingRepository.update(key, {
        value,
        type,
        group,
        description: description || undefined,
        updatedById: userId,
      })
    }

    return this.systemSettingRepository.create({
      key,
      value,
      type,
      group,
      description: description || undefined,
      createdById: userId,
    })
  }

  async updateSetting({
    key,
    value,
    type,
    group,
    description,
    userId,
  }: UpdateSystemSettingType & { key: string; userId: number }) {
    const setting = await this.systemSettingRepository.findByKey(key)
    if (!setting) {
      throw NotFoundRecordException
    }

    return this.systemSettingRepository.update(key, {
      value: value || undefined,
      type: type || undefined,
      group: group || undefined,
      description: description || undefined,
      updatedById: userId,
    })
  }

  async deleteSetting(key: string) {
    const setting = await this.systemSettingRepository.findByKey(key)
    if (!setting) {
      throw NotFoundRecordException
    }

    return this.systemSettingRepository.delete(key)
  }
}
