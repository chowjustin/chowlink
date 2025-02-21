import axios from 'axios';
import { useRouter } from 'next/router';
import * as React from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useQuery } from 'react-query';

import { getFromLocalStorage } from '@/lib/helper';
import useLoadingToast from '@/hooks/toast/useLoadingToast';

import Accent from '@/components/Accent';
import Button from '@/components/buttons/Button';
import Input from '@/components/forms/Input';
import Layout from '@/components/layout/Layout';
import PrimaryLink from '@/components/links/PrimaryLink';
import Seo from '@/components/Seo';

import { DEFAULT_TOAST_MESSAGE } from '@/constant/toast';

type NewLinkFormData = {
  slug: string;
  link: string;
};

export default function NewLinkPage() {
  const router = useRouter();
  const isLoading = useLoadingToast();

  const [isAuthenticating, setIsAuthenticating] = React.useState(true);

  //#region  //*=========== Auto Authentication ===========
  React.useEffect(() => {
    const token = getFromLocalStorage('@notiolink/app_token');

    if (!token) {
      // Auto login with hardcoded password
      setIsAuthenticating(true);
      axios
        .post<{ token: string }>('/api/login', { password: 'chow' })
        .then((res) => {
          localStorage.setItem('@notiolink/app_token', res.data.token);
          setIsAuthenticating(false);
        })
        .catch(() => {
          toast.error('Auto-login failed. Please try refreshing the page.');
          setIsAuthenticating(false);
        });
    } else {
      setIsAuthenticating(false);
    }
  }, []);
  //#endregion  //*======== Check Auth ===========

  //#region  //*=========== Form ===========
  const methods = useForm<NewLinkFormData>({
    mode: 'onTouched',
  });
  const { handleSubmit, setValue } = methods;
  //#endregion  //*======== Form ===========

  //#region  //*=========== Form Submit ===========
  const onSubmit: SubmitHandler<NewLinkFormData> = (data) => {
    if (isAuthenticating)
      toast.error('Authentication in progress. Please wait...');

    const token = getFromLocalStorage('@notiolink/app_token');

    toast
      .promise(
        axios
          .post('/api/new', data, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then(() => {
            router.replace(`/${data.slug}/detail`);
          }),
        {
          ...DEFAULT_TOAST_MESSAGE,
          success: 'Link successfully shortened',
        }
      )
      .catch((err: { response: { status: number } }) => {
        if (err.response.status === 401) {
          // If token expired, try to re-authenticate automatically
          axios
            .post<{ token: string }>('/api/login', { password: 'chow' })
            .then((res) => {
              localStorage.setItem('@notiolink/app_token', res.data.token);
              // Retry the original request with the new token
              return axios.post('/api/new', data, {
                headers: {
                  Authorization: `Bearer ${res.data.token}`,
                },
              });
            })
            .then(() => {
              router.replace(`/${data.slug}/detail`);
            })
            .catch(() => {
              toast.error(
                'Authentication failed. Please refresh the page and try again.'
              );
            });
        }
      });
  };
  //#endregion  //*======== Form Submit ===========

  //#region  //*=========== Set Slug Query ===========
  React.useEffect(() => {
    if (!router.isReady) return;
    const query = router.query;

    if (query.slug) {
      setValue('slug', query.slug as string);
    }
  }, [router.isReady, router.query, setValue]);
  //#endregion  //*======== Set Slug Query ===========

  //#region  //*=========== Get Suggestion List ===========
  const { data: categoriesData } = useQuery<{ categories: string[] }, Error>(
    `/api/categories`
  );
  const categories = categoriesData?.categories ?? [];
  //#endregion  //*======== Get Suggestion List ===========

  return (
    <Layout>
      <Seo templateTitle='' />
      <main>
        <section>
          <div className='flex min-h-screen w-full flex-col items-center justify-center py-20'>
            <h1 className='h0'>
              <Accent>ChowLink</Accent>
            </h1>

            {/* <Button
              className='absolute top-8 right-8'
              onClick={() => {
                localStorage.removeItem('@notiolink/app_token');
                router.push('/');
              }}
              variant='outline'
            >
              Logout
            </Button> */}

            <FormProvider {...methods}>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className='mt-8 w-full max-w-[40vw] max-md:max-w-[80vw]'
              >
                <div className='space-y-4'>
                  <Input
                    id='link'
                    label='Full Link'
                    helperText='Must include http or https'
                    placeholder='https://google.com'
                    autoFocus
                    validation={{
                      required: 'Link must be filled',
                      pattern: {
                        value:
                          /^(?:https?:\/\/|s?ftps?:\/\/)(?!www | www\.)[A-Za-z0-9_-]+\.+[A-Za-z0-9./%#*&=?_:;-]+$/,
                        message: 'Please input a valid link',
                      },
                    }}
                  />
                  <Input
                    id='slug'
                    label='Slug'
                    placeholder='slug'
                    validation={{
                      required: 'Slug must be filled',
                      pattern: {
                        value: /^\S+$/,
                        message: 'Cannot include whitespace',
                      },
                    }}
                  />
                  {/* <Input
                    id='category'
                    label='Category (optional)'
                    placeholder='category'
                    list='category-list'
                    autoComplete='off'
                  /> */}
                  <datalist id='category-list'>
                    {categories?.map((category) => (
                      <option value={category} key={category} />
                    ))}
                  </datalist>
                </div>

                <div className='mt-5 flex flex-col'>
                  <Button
                    className='w-full justify-center md:ml-auto md:w-auto'
                    variant='outline'
                    type='submit'
                    isLoading={isLoading}
                  >
                    Shorten!
                  </Button>
                </div>
              </form>
            </FormProvider>
            <p className='absolute bottom-4 dark:text-gray-300 '>
              Built using{' '}
              <PrimaryLink href='https://github.com/theodorusclarence/notiolink'>
                <Accent>Notiolink</Accent>
              </PrimaryLink>
            </p>
          </div>
        </section>
      </main>
    </Layout>
  );
}
