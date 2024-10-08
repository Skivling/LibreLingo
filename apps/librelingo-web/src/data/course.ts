'use server'

import path from 'node:path'
import courseConfig from '@/courses/config.json'
import fs from 'node:fs'
import { notFound } from 'next/navigation'

export type CourseIdentityDescription = {
    sourceLanguageCode: string
    targetLanguageCode: string
}

export type Course = {
    id: string
    languageCode: string
    languageName: string
    uiLanguage: string
    repositoryURL: string
    inProduction: boolean
}

function getFullJsonPath(jsonPath: string) {
    return path.join(
        process.cwd(),
        'src',
        'courses',
        jsonPath,
        'courseData.json'
    )
}

async function getCourseMetadataByJsonPath(jsonPath: string) {
    const fileContent = await fs.promises.readFile(
        getFullJsonPath(jsonPath),
        'utf8'
    )
    return JSON.parse(fileContent)
}

export async function listAvailableCourses(): Promise<Course[]> {
    return Promise.all(
        courseConfig
            .filter((item) => {
                return (
                    item.deploy &&
                    fs.existsSync(getFullJsonPath(item.paths.jsonFolder))
                )
            })
            .map(async (item) => {
                const jsonPath = item.paths.jsonFolder
                const data = await getCourseMetadataByJsonPath(jsonPath)
                const {
                    uiLanguage,
                    languageName,
                    languageCode,
                    repositoryURL,
                } = data

                return {
                    id: jsonPath,
                    languageCode,
                    languageName,
                    uiLanguage,
                    repositoryURL,
                    inProduction: item.inProduction,
                }
            })
    )
}

export async function getCourseId(
    parameters: CourseIdentityDescription
): Promise<string> {
    const availableCourses = await listAvailableCourses()

    const course = availableCourses.find(
        (item) =>
            item.uiLanguage === parameters.sourceLanguageCode &&
            item.languageCode === parameters.targetLanguageCode
    )

    if (course === undefined) {
        notFound()
    }

    return course.id
}

export async function getCourseDetail(courseId: string) {
    const { languageName } = await getCourseMetadataByJsonPath(courseId)

    return {
        targetLanguage: {
            name: languageName,
        },
    }
}
