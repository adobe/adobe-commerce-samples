const ROLE_PREFIX = /^asset_role_/;
const AEM_ASSET_URN = /urn:aaid:aem:[0-9a-f-]+/i;

/**
 * Stable identity for an image URL: the AEM asset URN when present, otherwise
 * the URL path without query string.
 * @param {string} url
 * @returns {string}
 */
function imageKey(url) {
  if (typeof url !== 'string') {
    return '';
  }
  const urn = url.match(AEM_ASSET_URN);
  if (urn) {
    return urn[0].toLowerCase();
  }
  return url.split('?')[0].toLowerCase();
}

/**
 * Whether the client selected `roles` on the images field. Fragments are
 * treated as "selected" since they can't be cheaply inspected.
 * @param {object} info GraphQL resolve info.
 * @returns {boolean}
 */
function clientSelectedRoles(info) {
  const selections = info?.fieldNodes?.[0]?.selectionSet?.selections;
  if (!Array.isArray(selections)) {
    return true;
  }
  return selections.some(
    (selection) => selection.kind !== 'Field' || selection.name.value === 'roles',
  );
}

/**
 * Whether every image is missing roles.
 * @param {Array<{ roles?: string[] }>} images
 * @returns {boolean}
 */
function allRolesMissing(images) {
  return images.every((image) => !Array.isArray(image?.roles) || image.roles.length === 0);
}

/**
 * Fetches the product's media gallery from the Commerce REST API and returns a
 * map of image key -> Catalog Service style roles (e.g. "image", "thumbnail").
 * @param {object} root Parent product.
 * @param {object} context Resolver context.
 * @param {object} info Resolver info.
 * @returns {Promise<Map<string, string[]>>}
 */
async function fetchRolesByImage(root, context, info) {
  const entries = await context.CommerceRest.Query.restProductMedia({
    root,
    args: { sku: root.sku },
    context,
    info,
    selectionSet: '{ file types }',
  });

  const rolesByImage = new Map();
  for (const entry of entries ?? []) {
    const roles = (entry.types ?? []).map((type) => type.replace(ROLE_PREFIX, ''));
    if (entry.file && roles.length > 0) {
      rolesByImage.set(imageKey(entry.file), roles);
    }
  }
  return rolesByImage;
}

/**
 * Resolves `images`, filling in roles from the Commerce REST API when the
 * Catalog Service returned none for any image.
 */
async function resolveImages(root, args, context, info) {
  const images = root.images;

  if (
    !Array.isArray(images) ||
    images.length === 0 ||
    typeof root.sku !== 'string' ||
    !root.sku.trim() ||
    !clientSelectedRoles(info) ||
    !allRolesMissing(images)
  ) {
    return images;
  }

  try {
    const rolesByImage = await fetchRolesByImage(root, context, info);
    if (rolesByImage.size === 0) {
      return images;
    }
    return images.map((image) => ({
      ...image,
      roles: rolesByImage.get(imageKey(image.url)) ?? image.roles ?? [],
    }));
  } catch (err) {
    // REST unavailable or unauthorized: serve the Catalog Service images as-is.
    return images;
  }
}

const imagesResolver = {
  selectionSet: '{ sku }',
  resolve: resolveImages,
};

module.exports = {
  resolvers: {
    SimpleProductView: { images: imagesResolver },
    ComplexProductView: { images: imagesResolver },
  },
};
