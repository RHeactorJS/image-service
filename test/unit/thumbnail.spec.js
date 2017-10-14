/* global describe it expect */

import {thumbnail} from '../../src/operations/upload'
import fs from 'fs'
import gm from 'gm'
import Promise from 'bluebird'
Promise.promisifyAll(gm.prototype)
const im = gm.subClass({imageMagick: true})

const validateThumbnail = (image, done) => {
  const img = im(image, 'example.jpg')
  Promise
    .join(
      img.sizeAsync(),
      img.identifyAsync()
    )
    .spread((size, info) => {
      expect(size.width).toEqual(256)
      expect(size.height).toEqual(256)
      expect(info.format).toEqual('JPEG')
      done()
    })
}

describe('thumbnail', () => {
  it('should scale an JPEG image', done => {
    thumbnail(fs.readFileSync('./test/data/d4d4d4.jpg'), 'example.jpg')
      .then(image => validateThumbnail(image, done))
  })

  it('should scale a portrait image', done => {
    thumbnail(fs.readFileSync('./test/data/11154d.jpg'), 'example.jpg')
      .then(image => validateThumbnail(image, done))
  })

  it('should scale an PNG image', done => {
    thumbnail(fs.readFileSync('./test/data/d4d4d4.png'), 'example.png')
      .then(image => validateThumbnail(image, done))
  })

  it.skip('should reject on invalid image', done => {
    // Currently, gm does not handle broken images well: https://github.com/aheckmann/gm/issues/495
    thumbnail('foo', 'example.png')
      .catch(() => {
        done()
      })
  })
})
