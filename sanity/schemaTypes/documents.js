import {defineArrayMember, defineField, defineType} from 'sanity'

// =====================================================================
// scenario  ←→  object SCENARIOS trong code
// =====================================================================
export const scenario = defineType({
  name: 'scenario',
  title: 'Kịch bản',
  type: 'document',
  groups: [
    {name: 'story', title: 'Nội dung', default: true},
    {name: 'params', title: 'Thông số'},
    {name: 'events', title: 'Sự kiện'},
  ],
  fields: [
    defineField({name: 'name', title: 'Tên', type: 'string', group: 'story', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      title: 'Mã',
      type: 'slug',
      group: 'story',
      options: {source: 'name'},
      description: 'Khóa trong SCENARIOS: lam-phat, suy-thoai, khung-hoang, dinh-lam, ha-canh',
      validation: (r) => r.required(),
    }),
    defineField({name: 'tag', title: 'Nhãn ngắn', type: 'string', group: 'story'}),
    defineField({name: 'brief', title: 'Bối cảnh', type: 'text', rows: 4, group: 'story', validation: (r) => r.required()}),
    defineField({name: 'challenge', title: 'Thử thách', type: 'text', rows: 2, group: 'story'}),
    defineField({name: 'order', title: 'Thứ tự hiển thị', type: 'number', group: 'story'}),
    defineField({
      name: 'locked',
      title: 'Đã khóa',
      type: 'boolean',
      group: 'story',
      initialValue: false,
      readOnly: true,
      description: 'Tự bật khi có lượt chơi đầu tiên, vì lượt chơi được dựng lại từ thông số này. Muốn sửa: nhân bản thành kịch bản mới.',
    }),
    defineField({name: 'params', title: 'Thông số', type: 'scenarioParams', group: 'params', validation: (r) => r.required()}),
    defineField({
      name: 'events',
      title: 'Sự kiện',
      type: 'array',
      group: 'events',
      of: [defineArrayMember({type: 'scenarioEvent'})],
      validation: (r) =>
        r.custom((events) => {
          const qs = (events ?? []).map((e) => e.quarter)
          return new Set(qs).size === qs.length ? true : 'Mỗi quý chỉ được một sự kiện'
        }),
    }),
  ],
  readOnly: ({document}) => Boolean(document?.locked),
  orderings: [{title: 'Thứ tự', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'name', subtitle: 'tag'}},
})

// =====================================================================
// learnTopic  ←→  object LEARN trong code (tab Learn & các hộp "What is this?")
// =====================================================================
export const learnTopic = defineType({
  name: 'learnTopic',
  title: 'Bài học',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Tiêu đề', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'key',
      title: 'Khóa',
      type: 'string',
      description: 'Khóa trong LEARN: rate, qe, fg, adas (khớp data-learn trên nút "What is this?")',
      validation: (r) => r.required(),
    }),
    defineField({name: 'order', title: 'Thứ tự', type: 'number'}),
    defineField({name: 'entries', title: 'Các mục', type: 'array', of: [defineArrayMember({type: 'learnEntry'})]}),
  ],
  orderings: [{title: 'Thứ tự', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'key'}},
})

// =====================================================================
// player (tùy chọn)  ←→  không có trong code; chỉ cần nếu muốn lưu lượt chơi qua nhiều thiết bị.
// Không đăng nhập: client tự sinh một UUID, lưu ở localStorage và dùng làm authId.
// =====================================================================
export const player = defineType({
  name: 'player',
  title: 'Người chơi',
  type: 'document',
  fields: [
    defineField({
      name: 'authId',
      title: 'ID',
      type: 'string',
      readOnly: true,
      description: 'ID từ hệ thống đăng nhập, hoặc UUID ẩn danh của trình duyệt',
      validation: (r) => r.required(),
    }),
    defineField({name: 'displayName', title: 'Tên hiển thị', type: 'string'}),
    defineField({name: 'createdAt', title: 'Tạo lúc', type: 'datetime', readOnly: true}),
  ],
  preview: {
    select: {name: 'displayName', id: 'authId'},
    prepare: ({name, id}) => ({title: name || 'Ẩn danh', subtitle: id}),
  },
})

// =====================================================================
// run  ←→  APP.run (lượt đang chơi), APP.saved (chiến lược đã lưu),
//          benchmarks() (Taylor rule / Do nothing)
//
// decisions là nguồn sự thật; states và score là cache do server tính bằng engine.
// =====================================================================
export const run = defineType({
  name: 'run',
  title: 'Lượt chơi',
  type: 'document',
  groups: [
    {name: 'meta', title: 'Thông tin', default: true},
    {name: 'play', title: 'Quyết định'},
    {name: 'result', title: 'Kết quả'},
  ],
  fields: [
    defineField({
      name: 'kind',
      title: 'Loại',
      type: 'string',
      group: 'meta',
      options: {list: [{title: 'Người chơi', value: 'player'}, {title: 'Taylor rule', value: 'taylor'}, {title: 'Không làm gì', value: 'hold'}]},
      initialValue: 'player',
      readOnly: true,
    }),
    defineField({
      name: 'player',
      title: 'Người chơi',
      type: 'reference',
      to: [{type: 'player'}],
      group: 'meta',
      readOnly: true,
      validation: (r) =>
        r.custom((v, ctx) => {
          const kind = ctx.document?.kind
          if (kind === 'player' && !v) return 'Lượt người chơi phải có người chơi'
          if (kind !== 'player' && v) return 'Benchmark không gắn người chơi'
          return true
        }),
    }),
    defineField({name: 'scenario', title: 'Kịch bản', type: 'reference', to: [{type: 'scenario'}], group: 'meta', readOnly: true, validation: (r) => r.required()}),
    defineField({name: 'seed', title: 'Bộ sốc (APP.seed)', type: 'number', group: 'meta', readOnly: true}),
    defineField({name: 'noise', title: 'Bất định (APP.noise)', type: 'boolean', group: 'meta', readOnly: true}),
    defineField({
      name: 'status',
      title: 'Trạng thái',
      type: 'string',
      group: 'meta',
      options: {list: ['in_progress', 'completed', 'abandoned']},
      initialValue: 'in_progress',
      readOnly: true,
    }),
    defineField({name: 'quartersDone', title: 'Số quý đã chơi', type: 'number', group: 'meta', readOnly: true}),
    defineField({
      name: 'saved',
      title: 'Đã lưu để so sánh',
      type: 'boolean',
      group: 'meta',
      initialValue: false,
      description: 'Tương ứng một mục trong APP.saved (tab Compare strategies)',
    }),
    defineField({name: 'name', title: 'Tên chiến lược', type: 'string', group: 'meta', description: 'vd. "Hike hard early"'}),
    defineField({name: 'startedAt', title: 'Bắt đầu', type: 'datetime', group: 'meta', readOnly: true}),
    defineField({name: 'completedAt', title: 'Kết thúc', type: 'datetime', group: 'meta', readOnly: true}),

    defineField({
      name: 'decisions',
      title: 'Quyết định',
      type: 'array',
      group: 'play',
      readOnly: true,
      of: [defineArrayMember({type: 'decision'})],
      validation: (r) =>
        r.max(12).custom((ds) => ((ds ?? []).every((d, k) => d.quarter === k + 1) ? true : 'Quyết định phải liên tục từ Q1')),
    }),
    defineField({name: 'notes', title: 'Lập luận bảo vệ (APP.notes)', type: 'text', rows: 6, group: 'play'}),

    defineField({name: 'states', title: 'Trạng thái từng quý Q0–Q12 (run.H)', type: 'array', group: 'result', readOnly: true, of: [defineArrayMember({type: 'quarterState'})]}),
    defineField({name: 'score', title: 'Điểm (scoreRun)', type: 'runScore', group: 'result'}),
  ],
  orderings: [
    {title: 'Điểm cao nhất', name: 'scoreDesc', by: [{field: 'score.total', direction: 'desc'}]},
    {title: 'Mới nhất', name: 'newest', by: [{field: 'startedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {who: 'player.displayName', kind: 'kind', sc: 'scenario.name', total: 'score.total', grade: 'score.grade', q: 'quartersDone', name: 'name'},
    prepare: ({who, kind, sc, total, grade, q, name}) => ({
      title: `${kind === 'player' ? who || 'Ẩn danh' : kind === 'taylor' ? 'Taylor rule' : 'Không làm gì'}${name ? ' · ' + name : ''}`,
      subtitle: `${sc} · ${q ?? 0}/12 quý${total !== undefined ? ` · ${Math.round(total)} điểm (${grade})` : ''}`,
    }),
  },
})
