import {defineArrayMember, defineField, defineType} from 'sanity'

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
/**
 * Number field with validation mirroring the engine's clamp() rules.
 * @param {string} name
 * @param {string} title
 * @param {{min?: number, max?: number, step?: number, integer?: boolean, required?: boolean, initial?: number, description?: string}} [o]
 */
export const num = (name, title, o = {}) =>
  defineField({
    name,
    title,
    type: 'number',
    description: o.description,
    initialValue: o.initial,
    validation: (rule) => {
      let r = rule
      if (o.required !== false) r = r.required()
      if (o.integer) r = r.integer()
      if (o.min !== undefined) r = r.min(o.min)
      if (o.max !== undefined) r = r.max(o.max)
      if (o.step) {
        const step = o.step
        r = r.custom((v) =>
          v === undefined || Math.abs(v / step - Math.round(v / step)) < 1e-9 ? true : `Phải là bội số của ${step}`,
        )
      }
      return r
    },
  })

/** Read-only number, for values computed by the server engine. */
const out = (name, title) =>
  defineField({name, title: title ?? name, type: 'number', readOnly: true})

// ---------------------------------------------------------------------
// Scenario building blocks
// ---------------------------------------------------------------------

/** Field names match SCENARIOS[key] in the engine exactly, so params can be passed through unchanged. */
export const scenarioParams = defineType({
  name: 'scenarioParams',
  title: 'Thông số kịch bản',
  type: 'object',
  options: {columns: 2},
  fields: [
    num('pi0', 'Lạm phát ban đầu (%)'),
    num('piPrev', 'Lạm phát quý trước (%)'),
    defineField({
      name: 'yPre',
      title: 'Output gap 4 quý trước nhiệm kỳ',
      description: 'Theo thứ tự từ quý −4 đến quý −1',
      type: 'array',
      of: [defineArrayMember({type: 'number'})],
      validation: (r) => r.required().length(4),
    }),
    num('y0', 'Output gap ban đầu (%)'),
    num('u0', 'Thất nghiệp ban đầu (%)', {min: 0}),
    num('i0', 'Lãi suất chính sách ban đầu (%)', {min: 0, max: 12, step: 0.25}),
    num('B0', 'Bảng cân đối ban đầu (% GDP)', {min: 5, max: 45}),
    num('c0', 'Uy tín ban đầu (0–1)', {min: 0.15, max: 0.9}),
    num('rstar', 'Lãi suất thực trung lập r*'),
    num('uStar', 'Thất nghiệp tự nhiên u*', {initial: 4.5}),
    num('gPot', 'Tăng trưởng tiềm năng', {initial: 2}),
    num('tp', 'Phần bù kỳ hạn bình thường', {initial: 0.8}),
    num('sp', 'Chênh lệch rủi ro bình thường', {initial: 1.8}),
    num('stress0', 'Căng thẳng tài chính ban đầu', {min: 0, initial: 0}),
    num('supply0', 'Sốc cung ban đầu', {initial: 0}),
    num('supplyRho', 'Độ dai dẳng sốc cung ρ', {min: 0, max: 1, initial: 0.6}),
    num('demand0', 'Sốc cầu ban đầu', {initial: 0}),
  ],
})

export const scenarioEvent = defineType({
  name: 'scenarioEvent',
  title: 'Sự kiện',
  type: 'object',
  fields: [
    num('quarter', 'Quý xảy ra', {integer: true, min: 1, max: 12}),
    defineField({name: 'title', title: 'Tiêu đề', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'text', title: 'Nội dung', type: 'text', rows: 2}),
    defineField({
      name: 'kind',
      title: 'Loại',
      type: 'string',
      options: {list: ['good', 'bad', 'neutral'], layout: 'radio', direction: 'horizontal'},
      initialValue: 'neutral',
    }),
    num('supply', 'Tác động cung (pp)', {required: false, initial: 0}),
    num('demand', 'Tác động cầu (pp)', {required: false, initial: 0}),
    num('stress', 'Tác động căng thẳng tài chính', {required: false, initial: 0}),
  ],
  preview: {
    select: {q: 'quarter', title: 'title', kind: 'kind'},
    prepare: ({q, title, kind}) => ({title: `Q${q} · ${title}`, subtitle: kind}),
  },
})

// ---------------------------------------------------------------------
// Gameplay building blocks (embedded in `run`)
// ---------------------------------------------------------------------

export const decision = defineType({
  name: 'decision',
  title: 'Quyết định',
  type: 'object',
  fields: [
    num('quarter', 'Quý', {integer: true, min: 1, max: 12}),
    num('i', 'Lãi suất chính sách (%)', {min: 0, max: 12, step: 0.25}),
    num('qe', 'QE / QT (% GDP)', {min: -4, max: 5, step: 0.5}),
    defineField({
      name: 'fg',
      title: 'Forward guidance',
      type: 'number',
      options: {
        list: [
          {title: 'Strong ease', value: -2},
          {title: 'Lean ease', value: -1},
          {title: 'Neutral', value: 0},
          {title: 'Lean hike', value: 1},
          {title: 'Strong hike', value: 2},
        ],
      },
      validation: (r) => r.required().integer().min(-2).max(2),
    }),
    defineField({name: 'decidedAt', title: 'Thời điểm', type: 'datetime'}),
  ],
  preview: {
    select: {q: 'quarter', i: 'i', qe: 'qe', fg: 'fg'},
    prepare: ({q, i, qe, fg}) => ({title: `Q${q}: ${i}%`, subtitle: `QE ${qe} · FG ${fg}`}),
  },
})

const contribY = defineField({
  name: 'cy',
  title: 'Phân rã Δ output gap',
  type: 'object',
  readOnly: true,
  fields: [out('inertia'), out('fin'), out('demand'), out('shock')],
})
const contribPi = defineField({
  name: 'cpi',
  title: 'Phân rã Δ lạm phát',
  type: 'object',
  readOnly: true,
  fields: [out('expect'), out('demand'), out('supply'), out('shock')],
})

/** One row of run.H in the engine. Field names match the engine's row keys. Written by the server only. */
export const quarterState = defineType({
  name: 'quarterState',
  title: 'Trạng thái quý',
  type: 'object',
  readOnly: true,
  fields: [
    out('t', 'Quý'),
    out('pi', 'Lạm phát'),
    out('core', 'Lạm phát lõi'),
    out('piE', 'Kỳ vọng lạm phát'),
    out('y', 'Output gap'),
    out('u', 'Thất nghiệp'),
    out('g', 'Tăng trưởng GDP'),
    out('i', 'Lãi suất chính sách'),
    out('di', 'Δ lãi suất'),
    out('B', 'Bảng cân đối (% GDP)'),
    out('qe', 'QE thực hiện'),
    out('fg', 'Guidance'),
    out('c', 'Uy tín'),
    out('stress'),
    out('supply'),
    out('demand'),
    out('tp', 'Phần bù kỳ hạn'),
    out('L', 'Lợi suất 10 năm'),
    out('sp', 'Chênh lệch rủi ro'),
    out('lend', 'Lãi suất cho vay'),
    out('rl', 'Lãi suất thực'),
    out('f', 'Điều kiện tài chính'),
    out('credit', 'Tăng trưởng tín dụng'),
    out('shockD', 'Sốc cầu ngẫu nhiên'),
    out('shockP', 'Sốc giá ngẫu nhiên'),
    defineField({name: 'eventQuarter', title: 'Sự kiện (quý)', type: 'number', readOnly: true}),
    contribY,
    contribPi,
    defineField({
      name: 'fc',
      title: 'Dự báo không nhiễu 1 quý',
      type: 'object',
      readOnly: true,
      fields: [out('pi'), out('u'), out('y'), out('g')],
    }),
  ],
  preview: {
    select: {t: 't', pi: 'pi', u: 'u'},
    prepare: ({t, pi, u}) => ({title: `Q${t}`, subtitle: `π ${pi?.toFixed(1)}% · u ${u?.toFixed(1)}%`}),
  },
})

export const runScore = defineType({
  name: 'runScore',
  title: 'Điểm',
  type: 'object',
  readOnly: true,
  fields: [
    out('total', 'Tổng'),
    defineField({name: 'grade', title: 'Xếp loại', type: 'string', readOnly: true}),
    out('price', 'Ổn định giá'),
    out('jobs', 'Việc làm'),
    out('growth', 'Sản lượng'),
    out('fin', 'Ổn định tài chính'),
    out('cred', 'Uy tín'),
    out('ePi'),
    out('eU'),
    out('eG'),
    out('vol'),
    out('sacrifice', 'Tỷ lệ hy sinh'),
    out('peakRate', 'Lãi suất đỉnh'),
    out('maxB', 'Bảng cân đối lớn nhất'),
    out('brokenFG', 'Số lần làm trái guidance'),
  ],
})

export const learnEntry = defineType({
  name: 'learnEntry',
  title: 'Mục',
  type: 'object',
  fields: [
    defineField({name: 'term', title: 'Tiêu đề mục', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'body', title: 'Nội dung', type: 'array', of: [defineArrayMember({type: 'block'})]}),
  ],
})
