import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'zh'];
const defaultLocale = 'en';

// 创建 next-intl 中间件
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
});

export default async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 如果访问根路径，重定向到默认语言并保留查询参数
  if (pathname === '/') {
    const url = new URL(`/${defaultLocale}${pathname}${search}`, request.url);
    return NextResponse.redirect(url);
  }

  // 处理语言切换时的重定向
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    // 如果 URL 中没有语言前缀，添加默认语言前缀
    const url = new URL(`/${defaultLocale}${pathname}${search}`, request.url);
    return NextResponse.redirect(url);
  }

  // 其他路径使用 next-intl 中间件处理
  return intlMiddleware(request);
}

export const config = {
  // 匹配所有路径，除了 api、_next、静态文件等
  matcher: ['/((?!api|_next|.*\\..*).*)']
}; 