import {
  createStep,
  createWorkflow,
  WorkflowResponse,
  StepResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { Link } from "@medusajs/modules-sdk"
import type { LinkDefinition } from "@medusajs/types"
import { ADDITIONAL_INFO_MODULE } from "../modules/additional-info/constants"
import AdditionalInfoService from "../modules/additional-info/service"

export type CreateAdditionalInfoValueInput = {
  product_id: string
  template_id: string
  values: Record<string, any>
}

type AdditionalInfoValueRecord = {
  id: string
}

type AdditionalInfoLinkInput = {
  value_id: string
  product_id: string
}

type AdditionalInfoLinkDefinition = LinkDefinition & {
  [ADDITIONAL_INFO_MODULE]: {
    additional_info_value_id: string
  }
  [Modules.PRODUCT]: {
    product_id: string
  }
}

export const createAdditionalInfoValuesStep = createStep<
  CreateAdditionalInfoValueInput[],
  AdditionalInfoValueRecord[],
  string[]
>(
  "create-additional-info-values-step",
  async (input: CreateAdditionalInfoValueInput[], { container }) => {
    const service: AdditionalInfoService = container.resolve(
      ADDITIONAL_INFO_MODULE
    )

    const createdValues =
      (await service.createAdditionalInfoValues(input)) as AdditionalInfoValueRecord[]

    return new StepResponse(
      createdValues,
      createdValues.map((value) => value.id)
    )
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }
    const service: AdditionalInfoService = container.resolve(
      ADDITIONAL_INFO_MODULE
    )

    await service.deleteAdditionalInfoValues(ids)
  }
)

export const linkAdditionalInfoProductStep = createStep<
  AdditionalInfoLinkInput[],
  AdditionalInfoLinkDefinition[],
  AdditionalInfoLinkDefinition[]
>(
  "link-additional-info-product-step",
  async (links: AdditionalInfoLinkInput[], { container }) => {
    const linkService = container.resolve<Link>(
      ContainerRegistrationKeys.LINK
    )

    const linkDefinitions: AdditionalInfoLinkDefinition[] = links.map(
      (link) => ({
        [ADDITIONAL_INFO_MODULE]: {
          additional_info_value_id: link.value_id,
        },
        [Modules.PRODUCT]: {
          product_id: link.product_id,
        },
      })
    )

    await linkService.create(linkDefinitions)

    return new StepResponse(linkDefinitions, linkDefinitions)
  },
  async (
    linkDefinitions: AdditionalInfoLinkDefinition[] | undefined,
    { container }
  ) => {
    if (!linkDefinitions?.length) {
      return
    }
    const linkService = container.resolve<Link>(
      ContainerRegistrationKeys.LINK
    )
    await linkService.dismiss(linkDefinitions)
  }
)

export const createAdditionalInfoValuesWorkflow = createWorkflow(
  "create-additional-info-values",
  (input: CreateAdditionalInfoValueInput[]) => {
    const values = createAdditionalInfoValuesStep(input)

    const links = transform({ values, input }, (data) => {
      return data.values.map((v, i) => ({
        value_id: v.id,
        product_id: data.input[i].product_id
      }))
    })

    linkAdditionalInfoProductStep(links)

    return new WorkflowResponse(values)
  }
)
